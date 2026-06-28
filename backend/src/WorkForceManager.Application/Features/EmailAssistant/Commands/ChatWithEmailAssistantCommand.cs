using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.EmailAssistant.Commands;

public class ChatWithEmailAssistantCommand : IRequest<string>
{
    [JsonPropertyName("messages")]
    public List<AiChatMessageDto> Messages { get; set; } = new();
}

public class ChatWithEmailAssistantCommandHandler : IRequestHandler<ChatWithEmailAssistantCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMailClientService _mailClientService;
    private readonly IAiService _aiService;

    public ChatWithEmailAssistantCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IMailClientService mailClientService,
        IAiService aiService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _mailClientService = mailClientService;
        _aiService = aiService;
    }

    public async Task<string> Handle(ChatWithEmailAssistantCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null) return "Vui lòng đăng nhập để sử dụng Trợ lý Email.";

        var config = await _context.UserEmailConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        if (config == null)
        {
            return "Bạn chưa cấu hình hòm thư. Vui lòng bấm vào nút cài đặt cấu hình hòm thư (Gmail hoặc IMAP/SMTP) ở bên trái trước khi bắt đầu trò chuyện.";
        }

        var lastUserMessage = request.Messages.LastOrDefault(m => m.Role.Equals("user", StringComparison.OrdinalIgnoreCase))?.Content ?? "";
        var text = lastUserMessage.ToLower();

        // Chuẩn bị danh sách tin nhắn gửi sang LLM
        var messagesToSend = new List<AiChatMessageDto>(request.Messages);

        // 1. Kiểm tra xem người dùng có nhắc đến số thứ tự email cụ thể hay không (VD: email 1, email số 2)
        var emailIndexMatch = Regex.Match(text, @"(?:email|thư)\s*(?:số)?\s*(\d+)", RegexOptions.IgnoreCase);
        if (emailIndexMatch.Success && int.TryParse(emailIndexMatch.Groups[1].Value, out int emailIndex))
        {
            // Tìm danh sách email gần nhất để lấy ID
            var recentEmails = await _mailClientService.SearchEmailsAsync(config, null, 10, cancellationToken);
            if (emailIndex >= 1 && emailIndex <= recentEmails.Count)
            {
                var targetEmail = recentEmails[emailIndex - 1];
                // Lấy chi tiết nội dung đầy đủ của email mục tiêu
                var detailedEmail = await _mailClientService.GetEmailDetailsAsync(config, targetEmail.MessageId, cancellationToken);
                if (detailedEmail != null)
                {
                    // Chèn nội dung chi tiết vào ngữ cảnh hệ thống ngay trước tin nhắn cuối cùng của người dùng
                    var detailContext = new AiChatMessageDto
                    {
                        Role = "system",
                        Content = $"[HỆ THỐNG - DỮ LIỆU EMAIL CHI TIẾT]\n" +
                                 $"Người dùng đang yêu cầu thông tin về Email số {emailIndex}.\n" +
                                 $"Chi tiết Email:\n" +
                                 $"- ID: {detailedEmail.MessageId}\n" +
                                 $"- Từ: {detailedEmail.From}\n" +
                                 $"- Đến: {detailedEmail.To}\n" +
                                 $"- Ngày: {detailedEmail.Date?.ToString("dd/MM/yyyy HH:mm")}\n" +
                                 $"- Tiêu đề: {detailedEmail.Subject}\n" +
                                 $"- Nội dung đầy đủ (Body):\n{detailedEmail.Body}\n" +
                                 $"[HẾ THỐNG - HẾT DỮ LIỆU]"
                    };
                    
                    if (messagesToSend.Count > 0)
                    {
                        messagesToSend.Insert(messagesToSend.Count - 1, detailContext);
                    }
                    else
                    {
                        messagesToSend.Add(detailContext);
                    }
                }
            }
        }
        // 2. Tải ngữ cảnh email liên quan (chạy vô điều kiện để AI luôn có dữ liệu chính xác)
        int limit = 15;
        var limitMatch = Regex.Match(text, @"(\d+)\s*(?:email|thư|mail|tin nhắn)");
        if (limitMatch.Success && int.TryParse(limitMatch.Groups[1].Value, out int parsedLimit))
        {
            limit = Math.Clamp(parsedLimit, 1, 20);
        }
        else
        {
            var limitMatchTrailing = Regex.Match(text, @"(?:email|thư|mail|tin nhắn)\s*(\d+)");
            if (limitMatchTrailing.Success && int.TryParse(limitMatchTrailing.Groups[1].Value, out int parsedLimitTrailing))
            {
                limit = Math.Clamp(parsedLimitTrailing, 1, 20);
            }
        }

        string? searchKeyword = ExtractSearchKeyword(lastUserMessage);
        
        // Nếu từ khóa chỉ là một con số (đã dùng để xác định limit), ta đặt nó về null để tải email mới nhất
        if (searchKeyword != null && int.TryParse(searchKeyword, out _))
        {
            searchKeyword = null;
        }

        List<EmailMessageDto> foundEmails = new();
        if (!string.IsNullOrEmpty(searchKeyword))
        {
            // Thử tìm kiếm theo từ khóa trước
            foundEmails = await _mailClientService.SearchEmailsAsync(config, searchKeyword, limit, cancellationToken);
        }

        // Nếu không tìm kiếm theo từ khóa hoặc kết quả tìm kiếm rỗng, tải danh sách email mới nhất làm ngữ cảnh mặc định
        if (!foundEmails.Any())
        {
            foundEmails = await _mailClientService.SearchEmailsAsync(config, null, limit, cancellationToken);
        }
        
        if (foundEmails.Any())
        {
            var emailListContext = new StringBuilder();
            emailListContext.AppendLine("[HỆ THỐNG - DANH SÁCH EMAIL GẦN NHẤT ĐƯỢC TÌM THẤY]");
            if (!string.IsNullOrEmpty(searchKeyword))
            {
                emailListContext.AppendLine($"*(Được lọc theo từ khóa: \"{searchKeyword}\")*");
            }
            int idx = 1;
            foreach (var email in foundEmails)
            {
                emailListContext.AppendLine($"{idx}️⃣ **[{email.Date?.ToString("dd/MM/yyyy HH:mm")}]** Từ: {email.From}");
                emailListContext.AppendLine($"   Tiêu đề: {email.Subject}");
                emailListContext.AppendLine($"   Tóm tắt: {email.Snippet}");
                emailListContext.AppendLine($"   ID: {email.MessageId}");
                emailListContext.AppendLine();
                idx++;
            }
            emailListContext.AppendLine("[HỆ THỐNG - HẾT DANH SÁCH]");

            var searchContext = new AiChatMessageDto
            {
                Role = "system",
                Content = emailListContext.ToString()
            };
            
            if (messagesToSend.Count > 0)
            {
                messagesToSend.Insert(messagesToSend.Count - 1, searchContext);
            }
            else
            {
                messagesToSend.Add(searchContext);
            }
        }

        // Định hình System Prompt tiếng Việt cho Trợ lý Email
        var systemInstruction = 
            "Bạn là Trợ lý Email tiếng Việt của SAIGON SPICES, một trợ lý hữu ích, ngắn gọn và bảo mật.\n" +
            "Hãy hỗ trợ người dùng lọc, tìm kiếm, tóm tắt và soạn email dựa trên thông tin được cung cấp.\n\n" +
            $"Hôm nay là ngày: {DateTime.UtcNow.AddHours(7).ToString("dd/MM/yyyy")} (Vietnam Time).\n\n" +
            "Nguyên tắc trả lời:\n" +
            "1. Luôn mở đầu bằng lời chào/xác nhận ngắn gọn (VD: 'Dạ, tôi đã tìm thấy...', 'Dạ, đây là...').\n" +
            "2. Khi liệt kê danh sách email, hãy đánh số 1️⃣, 2️⃣, 3️⃣... Kèm ngày tháng gửi, tiêu đề và tóm tắt ngắn 2-3 câu chứa mục đích chính, deadline/hạn chót và việc cần làm.\n" +
            "3. Khi người dùng hỏi thêm về một thư (VD: 'Thư số 2 nói gì?'), hãy sử dụng thông tin trong ngữ cảnh hệ thống có chứa 'Nội dung đầy đủ' để trả lời chi tiết và tham chiếu chính xác (VD: 'Email số 2 đề cập...').\n" +
            "4. Quyền riêng tư: Không hiển thị toàn bộ nội dung email trừ khi người dùng yêu cầu trực tiếp. Không tự bịa thông tin email nếu không có trong dữ liệu hòm thư.";

        return await _aiService.GetChatCompletionAsync(messagesToSend, systemInstruction, cancellationToken);
    }

    private string? ExtractSearchKeyword(string text)
    {
        // Trích xuất từ khóa trong ngoặc kép
        var match = Regex.Match(text, "\"(.*?)\"");
        if (match.Success) return match.Groups[1].Value;

        // Xóa bớt các từ chỉ hành động tìm kiếm thông dụng để lấy từ khóa cốt lõi
        var clean = text;
        string[] stopWords = { 
            "tìm kiếm", "tìm", "lọc", "các", "những", "email", "thư", "mail", "nội dung", 
            "gần đây", "mới nhất", "chứa từ", "có từ", "hôm nay", "ngày hôm nay", 
            "hôm qua", "ngày hôm qua", "nhất", "gần", "đây", "tin nhắn", "tin", "số", "lượng",
            "tóm tắt", "tổng hợp", "đọc", "xem", "viết", "soạn", "trả lời", "dịch", "gửi",
            "hãy", "giúp", "yêu cầu", "vui lòng"
        };
        foreach (var word in stopWords)
        {
            clean = Regex.Replace(clean, "\\b" + word + "\\b", "", RegexOptions.IgnoreCase);
        }

        clean = clean.Replace("?", "").Replace(".", "").Trim();
        return string.IsNullOrEmpty(clean) ? null : clean;
    }
}
