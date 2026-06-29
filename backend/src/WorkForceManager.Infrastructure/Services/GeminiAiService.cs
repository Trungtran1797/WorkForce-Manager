using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
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
        var model = _configuration["AiSettings:Model"] ?? "gemini-2.0-flash";
        var endpoint = _configuration["AiSettings:Endpoint"] ?? "https://generativelanguage.googleapis.com/v1beta/models";

        try
        {
            var settings = await _context.SystemSettings.ToListAsync(ct);
            var dbProviderSetting = settings.FirstOrDefault(s => s.Key.Equals("AiProvider", StringComparison.OrdinalIgnoreCase));
            var dbModelSetting = settings.FirstOrDefault(s => s.Key.Equals("AiModel", StringComparison.OrdinalIgnoreCase));
            var dbApiKeySetting = settings.FirstOrDefault(s => s.Key.Equals("AiApiKey", StringComparison.OrdinalIgnoreCase));

            if (dbProviderSetting != null && !string.IsNullOrEmpty(dbProviderSetting.Value))
            {
                provider = dbProviderSetting.Value;
            }
            if (dbModelSetting != null && !string.IsNullOrEmpty(dbModelSetting.Value))
            {
                model = dbModelSetting.Value;
            }
            else
            {
                model = provider.Equals("OpenAI", StringComparison.OrdinalIgnoreCase) ? "gpt-4o" : "gemini-2.0-flash";
            }
            if (dbApiKeySetting != null && !string.IsNullOrEmpty(dbApiKeySetting.Value))
            {
                apiKey = dbApiKeySetting.Value;
                try
                {
                    apiKey = _encryptionService.Decrypt(apiKey);
                }
                catch
                {
                    // Ignore decryption error if already plain
                }
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
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể tải cấu hình AI hệ thống từ database. Chuyển sang cấu hình appsettings.");
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
        catch (Exception ex) when (ex.Message.Contains("429") || ex.Message.Contains("TooManyRequests") || ex.Message.Contains("RESOURCE_EXHAUSTED"))
        {
            _logger.LogWarning(ex, "AI API quota exceeded (429). Đang chuyển sang Mock AI Fallback.");
            return GetMockAiResponse(messages) + "\n\n*(Lưu ý: Trợ lý AI đang ở chế độ mô phỏng do vượt giới hạn quota API hôm nay. Quota sẽ tự reset vào ngày mai, hoặc bạn có thể cập nhật API Key trong Cài đặt hệ thống.)*";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi gọi API AI thật. Đang chuyển sang Mock AI Fallback.");
            return GetMockAiResponse(messages) + "\n\n*(Lưu ý: Trợ lý AI đang ở chế độ mô phỏng do không kết nối được API. Vui lòng kiểm tra cấu hình AI trong Cài đặt hệ thống.)*";
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
        var text = lastUserMessage.ToLower().Trim();

        // Thử đọc dữ liệu email thật từ system context được inject bởi ChatWithEmailAssistantCommandHandler
        var systemContext = messages
            .Where(m => m.Role.Equals("system", StringComparison.OrdinalIgnoreCase) && m.Content.Contains("[HỆ THỐNG - DANH SÁCH EMAIL"))
            .FirstOrDefault()?.Content;

        var detailContext = messages
            .Where(m => m.Role.Equals("system", StringComparison.OrdinalIgnoreCase) && m.Content.Contains("[HỆ THỐNG - DỮ LIỆU EMAIL CHI TIẾT]"))
            .FirstOrDefault()?.Content;

        // 1. Chào hỏi/Xác định danh tính
        if (text.Contains("chào") || text.Contains("hello") || text.Contains("hi") || text.Contains("hey") || text.Contains("bạn là ai") || text.Contains("tên là gì"))
        {
            return "Chào bạn! Tôi là **Trợ lý Email AI** của SAIGON SPICES (đang chạy ở chế độ mô phỏng).\n\n" +
                   "Bạn có thể yêu cầu tôi tìm kiếm email (VD: *'Tìm email mới nhất'*, *'Lọc thư từ HR'*) hoặc đọc chi tiết thư (VD: *'Xem email số 1'*).";
        }

        // 2. Ý định trò chuyện phi email / phản hồi lại việc trò chuyện
        if (text.Contains("trò chuyện") || text.Contains("nói chuyện") || text.Contains("tán gẫu") || text.Contains("chơi") || text.Contains("hỏi thăm") || text.Contains("với bạn"))
        {
            return "Hiện tại tôi đang hoạt động ở **chế độ mô phỏng (Mock mode)** nên khả năng trò chuyện tự do bị giới hạn.\n\n" +
                   "Vui lòng thiết lập **API Key thật** (Gemini/OpenAI) trong **Cài đặt hệ thống** để có thể trò chuyện tự nhiên và phân tích thông tin đầy đủ.";
        }

        // 3. Đọc chi tiết email
        bool isDetailIntent = text.Contains("chi tiết") || text.Contains("xem") || text.Contains("đọc") || text.Contains("mở");
        bool hasNumber = Regex.IsMatch(text, @"(?:email|thư|số)?\s*\d+");
        if (!string.IsNullOrEmpty(detailContext) && (isDetailIntent || hasNumber))
        {
            return FormatEmailDetailFromContext(detailContext);
        }

        // 4. Tìm kiếm/Lọc email (Có từ khóa tìm kiếm rõ ràng)
        bool isSearchIntent = text.Contains("email") || text.Contains("thư") || text.Contains("mail") ||
                             text.Contains("tìm") || text.Contains("lọc") || text.Contains("danh sách") ||
                             text.Contains("gần nhất") || text.Contains("mới nhất") || text.Contains("list") ||
                             text.Contains("show") || text.Contains("hiển thị");

        if (!string.IsNullOrEmpty(systemContext) && (isSearchIntent || string.IsNullOrEmpty(text)))
        {
            return FormatEmailListFromContext(systemContext);
        }

        // 5. Câu hỏi về deadline/hạn chót
        if (text.Contains("deadline") || text.Contains("hạn chót") || text.Contains("lịch") || text.Contains("công việc"))
        {
            return "Để phân tích chính xác hạn chót từ hòm thư, bạn cần cấu hình API Key thật (Gemini/OpenAI) trong Cài đặt hệ thống.";
        }

        // 6. Cảm ơn
        if (text.Contains("cảm ơn") || text.Contains("cám ơn") || text.Contains("thank"))
        {
            return "Không có gì. Tôi luôn sẵn sàng hỗ trợ tìm kiếm và tóm tắt email công việc của bạn.";
        }

        // 7. Fallback cuối cùng nếu có system context và không có ý định trò chuyện phi email rõ ràng
        if (!string.IsNullOrEmpty(systemContext))
        {
            return FormatEmailListFromContext(systemContext);
        }

        return "Tôi là Trợ lý Email AI (chế độ mô phỏng). Bạn có thể tìm kiếm email mới hoặc yêu cầu đọc chi tiết thư (VD: *'Xem email số 1'*).";
    }

    private static string FormatEmailListFromContext(string systemContext)
    {
        // Trích xuất khối email từ system context đã được inject
        // System context có định dạng:
        //   1️⃣ **[date]** Từ: sender
        //      Tiêu đề: subject
        //      Tóm tắt: snippet
        //      ID: messageId
        //      Tệp đính kèm:
        //        - Tên: file.pdf (Size: ... | PartSpecifier: 1 | AttachmentId: abc)

        var lines = systemContext.Split('\n');
        var sb = new StringBuilder();
        sb.AppendLine("Dạ, đây là danh sách email từ hòm thư của bạn:\n");

        string currentMessageId = "";
        bool inAttachment = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine.TrimEnd();

            if (line.StartsWith("[HỆ THỐNG")) continue;
            if (line.StartsWith("*(Được lọc")) continue;

            // Dòng đánh số email: 1️⃣, 2️⃣, ...
            if (Regex.IsMatch(line, @"^\d+️⃣"))
            {
                sb.AppendLine(line);
                inAttachment = false;
                continue;
            }

            if (line.Contains("ID:"))
            {
                var idMatch = Regex.Match(line, @"ID:\s*(.+)");
                if (idMatch.Success) currentMessageId = idMatch.Groups[1].Value.Trim();
                continue; // Không hiển thị raw ID line
            }

            if (line.TrimStart().StartsWith("Tệp đính kèm:"))
            {
                sb.AppendLine("   📎 **Tệp đính kèm:**");
                inAttachment = true;
                continue;
            }

            if (inAttachment && line.TrimStart().StartsWith("- Tên:"))
            {
                // Phân tích: - Tên: file.pdf (Size: 123 KB | PartSpecifier: 2 | AttachmentId: xyz)
                var nameMatch = Regex.Match(line, @"Tên:\s*([^\(]+)");
                var partMatch = Regex.Match(line, @"PartSpecifier:\s*([^\|]+)");
                var attIdMatch = Regex.Match(line, @"AttachmentId:\s*([^\)]+)");
                var sizeMatch = Regex.Match(line, @"Size:\s*([^\|]+)");

                var fileName = nameMatch.Success ? nameMatch.Groups[1].Value.Trim() : "attachment";
                var partSpecifier = partMatch.Success ? partMatch.Groups[1].Value.Trim() : "";
                var attachmentId = attIdMatch.Success ? attIdMatch.Groups[1].Value.Trim() : "";
                var size = sizeMatch.Success ? sizeMatch.Groups[1].Value.Trim() : "";

                var encodedFileName = Uri.EscapeDataString(fileName);
                var downloadUrl = $"/api/v1/email-assistant/attachment?messageId={Uri.EscapeDataString(currentMessageId)}&partSpecifier={Uri.EscapeDataString(partSpecifier)}&attachmentId={Uri.EscapeDataString(attachmentId)}&fileName={encodedFileName}";

                sb.AppendLine($"   📎 [**{fileName}**]({downloadUrl}) ({size})");
                continue;
            }

            if (inAttachment && string.IsNullOrWhiteSpace(line))
            {
                inAttachment = false;
            }

            if (!string.IsNullOrWhiteSpace(line))
            {
                sb.AppendLine(line);
            }
            else
            {
                sb.AppendLine();
            }
        }

        sb.AppendLine("\nBạn có muốn xem chi tiết hoặc tải tệp đính kèm của email nào không?");
        return sb.ToString();
    }

    private static string FormatEmailDetailFromContext(string detailContext)
    {
        var lines = detailContext.Split('\n');
        var sb = new StringBuilder();
        sb.AppendLine("Dạ, đây là chi tiết email:\n");

        string messageId = "";
        foreach (var rawLine in lines)
        {
            var line = rawLine.TrimEnd();
            if (line.StartsWith("[HỆ THỐNG")) continue;

            if (line.StartsWith("- ID:"))
            {
                var idMatch = Regex.Match(line, @"- ID:\s*(.+)");
                if (idMatch.Success) messageId = idMatch.Groups[1].Value.Trim();
                continue;
            }

            sb.AppendLine(line.TrimStart('-').Trim());
        }

        return sb.ToString();
    }

    #endregion
}
