using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Infrastructure.Services;

public class GeminiAiService : IAiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiAiService> _logger;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEncryptionService _encryptionService;

    public GeminiAiService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GeminiAiService> logger,
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IEncryptionService encryptionService)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _context = context;
        _currentUserService = currentUserService;
        _encryptionService = encryptionService;
    }

    public async Task<string> GetChatCompletionAsync(List<AiChatMessageDto> messages, string? systemPrompt = null, CancellationToken ct = default)
    {
        var provider = _configuration["AiSettings:Provider"] ?? "Gemini";
        var apiKey = _configuration["AiSettings:ApiKey"];
        var model = _configuration["AiSettings:Model"] ?? "gemini-1.5-flash";
        var endpoint = _configuration["AiSettings:Endpoint"] ?? "https://generativelanguage.googleapis.com/v1beta/models";

        try
        {
            var userId = _currentUserService.UserId;
            if (userId != null)
            {
                var userConfig = await _context.UserEmailConfigs
                    .FirstOrDefaultAsync(x => x.UserId == userId, ct);

                if (userConfig != null && !string.IsNullOrEmpty(userConfig.AiProvider))
                {
                    provider = userConfig.AiProvider;
                    model = userConfig.AiModel ?? (provider.Equals("OpenAI", StringComparison.OrdinalIgnoreCase) ? "gpt-4o" : "gemini-1.5-flash");

                    if (!string.IsNullOrEmpty(userConfig.AiApiKey))
                    {
                        apiKey = _encryptionService.Decrypt(userConfig.AiApiKey);
                    }

                    if (provider.Equals("OpenAI", StringComparison.OrdinalIgnoreCase))
                    {
                        endpoint = "https://api.openai.com/v1";
                    }
                    else
                    {
                        endpoint = "https://generativelanguage.googleapis.com/v1beta/models";
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể tải cấu hình AI cá nhân của người dùng. Chuyển sang cấu hình hệ thống.");
        }

        if (string.IsNullOrEmpty(apiKey) || apiKey.Equals("YOUR_GEMINI_API_KEY", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("AiSettings:ApiKey chưa được cấu hình. Sử dụng Mock AI Fallback.");
            return GetMockAiResponse(messages);
        }

        try
        {
            if (provider.Equals("OpenAI", StringComparison.OrdinalIgnoreCase))
            {
                return await CallOpenAiApiAsync(endpoint, apiKey, model, messages, systemPrompt, ct);
            }
            else
            {
                return await CallGeminiApiAsync(endpoint, apiKey, model, messages, systemPrompt, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi gọi API AI thật. Đang chuyển sang Mock AI Fallback.");
            return GetMockAiResponse(messages) + "\n\n*(Lưu ý: Phản hồi này được tạo bởi Mock AI do lỗi kết nối tới API thật)*";
        }
    }

    private async Task<string> CallGeminiApiAsync(string endpoint, string apiKey, string model, List<AiChatMessageDto> messages, string? systemPrompt, CancellationToken ct)
    {
        using var client = _httpClientFactory.CreateClient();
        
        // Cấu hình URL gọi Gemini
        var url = $"{endpoint.TrimEnd('/')}/{model}:generateContent?key={apiKey}";

        // Tách system prompt
        var systemInstructionText = systemPrompt;
        var filteredMessages = new List<AiChatMessageDto>();
        foreach (var m in messages)
        {
            if (m.Role.Equals("system", StringComparison.OrdinalIgnoreCase))
            {
                systemInstructionText = (systemInstructionText == null) ? m.Content : systemInstructionText + "\n" + m.Content;
            }
            else
            {
                filteredMessages.Add(m);
            }
        }

        // Tạo cấu trúc request Gemini
        var contentsList = new List<object>();
        foreach (var m in filteredMessages)
        {
            var role = m.Role.Equals("assistant", StringComparison.OrdinalIgnoreCase) ? "model" : "user";
            contentsList.Add(new
            {
                role = role,
                parts = new[] { new { text = m.Content } }
            });
        }

        object requestBody;
        if (!string.IsNullOrEmpty(systemInstructionText))
        {
            requestBody = new
            {
                contents = contentsList,
                systemInstruction = new
                {
                    parts = new[] { new { text = systemInstructionText } }
                }
            };
        }
        else
        {
            requestBody = new
            {
                contents = contentsList
            };
        }

        var response = await client.PostAsJsonAsync(url, requestBody, ct);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(ct);
            throw new Exception($"Gemini API error (Status {response.StatusCode}): {errorContent}");
        }

        var root = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        if (root.TryGetProperty("candidates", out var candidatesProp) && 
            candidatesProp.ValueKind == JsonValueKind.Array && 
            candidatesProp.GetArrayLength() > 0)
        {
            var firstCandidate = candidatesProp[0];
            if (firstCandidate.TryGetProperty("content", out var contentProp) &&
                contentProp.TryGetProperty("parts", out var partsProp) &&
                partsProp.ValueKind == JsonValueKind.Array &&
                partsProp.GetArrayLength() > 0)
            {
                return partsProp[0].GetProperty("text").GetString() ?? string.Empty;
            }
        }

        return "Không nhận được phản hồi từ Gemini API.";
    }

    private async Task<string> CallOpenAiApiAsync(string endpoint, string apiKey, string model, List<AiChatMessageDto> messages, string? systemPrompt, CancellationToken ct)
    {
        using var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var url = endpoint.TrimEnd('/') + "/chat/completions";

        var openAiMessages = new List<object>();
        if (!string.IsNullOrEmpty(systemPrompt))
        {
            openAiMessages.Add(new { role = "system", content = systemPrompt });
        }

        foreach (var m in messages)
        {
            openAiMessages.Add(new { role = m.Role.ToLower(), content = m.Content });
        }

        var requestBody = new
        {
            model = model,
            messages = openAiMessages,
            temperature = 0.5
        };

        var response = await client.PostAsJsonAsync(url, requestBody, ct);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(ct);
            throw new Exception($"OpenAI API error (Status {response.StatusCode}): {errorContent}");
        }

        var root = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        if (root.TryGetProperty("choices", out var choicesProp) &&
            choicesProp.ValueKind == JsonValueKind.Array &&
            choicesProp.GetArrayLength() > 0)
        {
            return choicesProp[0].GetProperty("message").GetProperty("content").GetString() ?? string.Empty;
        }

        return "Không nhận được phản hồi từ OpenAI API.";
    }

    #region Mock AI Fallback Logic

    private string GetMockAiResponse(List<AiChatMessageDto> messages)
    {
        var lastUserMessage = messages.LastOrDefault(m => m.Role.Equals("user", StringComparison.OrdinalIgnoreCase))?.Content ?? "";
        var text = lastUserMessage.ToLower();

        if (text.Contains("tìm") || text.Contains("lọc") || text.Contains("search"))
        {
            return "Dạ, tôi đã tìm thấy 3 email phù hợp với yêu cầu của bạn từ hộp thư. Dưới đây là tóm tắt:\n\n" +
                   "1️⃣ **[28/06 - 09:30]** Từ: **sales@saigonspices.com.vn**\n" +
                   "   *Tiêu đề:* Xác nhận đơn hàng Hồ Tiêu Đen xuất khẩu #SP-2026-098\n" +
                   "   *Tóm tắt:* Đơn hàng 5 tấn hồ tiêu đen đã được xác nhận. Yêu cầu bộ phận kho chuẩn bị hàng để đóng container trước ngày 05/07. Cần phản hồi lịch xuất kho cho Logistics.\n\n" +
                   "2️⃣ **[27/06 - 15:45]** Từ: **hr@saigonspices.com.vn**\n" +
                   "   *Tiêu đề:* Thông báo lịch đánh giá năng lực nhân sự Q2/2026\n" +
                   "   *Tóm tắt:* Lịch đánh giá năng lực của phòng Kỹ Thuật và Văn Phòng sẽ diễn ra từ ngày 01/07 đến 05/07. Yêu cầu nhân viên tự nộp biểu mẫu tự đánh giá trước 30/06.\n\n" +
                   "3️⃣ **[25/06 - 11:15]** Từ: **ceo@saigonspices.com.vn**\n" +
                   "   *Tiêu đề:* Triệu tập họp khẩn Ban Giám Đốc sáng thứ Hai tuần tới\n" +
                   "   *Tóm tắt:* Cuộc họp về kế hoạch kinh doanh 6 tháng cuối năm sẽ bắt đầu lúc 08:30 sáng thứ Hai (29/06) tại Phòng Họp A. Yêu cầu chuẩn bị báo cáo tiến độ OKR.\n\n" +
                   "Bạn có muốn xem chi tiết hoặc trả lời email nào trong số này không?";
        }

        if (text.Contains("chi tiết email 1") || text.Contains("email số 1") || text.Contains("email 1"))
        {
            return "Dạ, đây là chi tiết của **Email số 1**:\n\n" +
                   "**Người gửi:** sales@saigonspices.com.vn\n" +
                   "**Thời gian:** 28/06/2026 09:30\n" +
                   "**Tiêu đề:** Xác nhận đơn hàng Hồ Tiêu Đen xuất khẩu #SP-2026-098\n\n" +
                   "**Nội dung đầy đủ:**\n" +
                   "Chào bộ phận điều hành,\n\n" +
                   "Chúng tôi xin xác nhận đơn hàng xuất khẩu 5 tấn Hồ Tiêu Đen đi thị trường Châu Âu (mã hợp đồng #SP-2026-098) đã hoàn tất thủ tục thanh toán đặt cọc 30%.\n\n" +
                   "Kế hoạch đóng hàng container dự kiến vào ngày 05/07/2026 tại Cảng Cát Lái. Yêu cầu ban quản lý kho phối hợp đóng gói tiêu chuẩn xuất khẩu và bàn giao phiếu cân (VGM) trước ngày 03/07/2026.\n\n" +
                   "Vui lòng phản hồi mail này để xác nhận lịch trình chuẩn bị.\n\n" +
                   "Trân trọng,\n" +
                   "Nguyễn Văn Nam - Phòng Kinh doanh.";
        }

        if (text.Contains("deadline") || text.Contains("hạn chót") || text.Contains("công việc"))
        {
            return "Dạ, tổng hợp các mốc thời gian và hạn chót quan trọng từ email gần nhất:\n\n" +
                   "- **30/06/2026**: Hạn cuối nộp biểu mẫu tự đánh giá năng lực nhân sự Q2 (từ email HR ngày 27/06).\n" +
                   "- **03/07/2026**: Hạn cuối bàn giao phiếu cân (VGM) đóng hàng xuất khẩu (từ email Sales ngày 28/06).\n" +
                   "- **05/07/2026**: Kế hoạch đóng hàng container xuất khẩu tiêu tại cảng (từ email Sales ngày 28/06).\n\n" +
                   "Bạn có cần tôi nhắc nhở hoặc đặt lịch hẹn cho mốc nào không?";
        }

        return "Dạ, tôi là **Trợ lý Email AI** của bạn. Hiện tại tôi đang chạy ở chế độ mô phỏng (Mock mode) do chưa kết nối API Key.\n\n" +
               "Tôi có thể hỗ trợ bạn:\n" +
               "1. Tìm kiếm và lọc email mới nhất (ví dụ gõ: *'Tìm email mới'*).\n" +
               "2. Tóm tắt nội dung chính và hạn chót (ví dụ gõ: *'Hạn chót tuần này là gì?'*).\n" +
               "3. Xem chi tiết từng thư để xử lý tiếp (ví dụ gõ: *'Xem email số 1'*).\n\n" +
               "Hãy cho tôi biết bạn muốn thực hiện hành động nào!";
    }

    #endregion
}
