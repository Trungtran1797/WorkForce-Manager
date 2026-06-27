namespace WorkForceManager.Application.Common.Interfaces;

public interface IAiService
{
    /// <summary>
    /// Gửi danh sách tin nhắn đến mô hình AI để nhận câu trả lời.
    /// </summary>
    Task<string> GetChatCompletionAsync(List<AiChatMessageDto> messages, string? systemPrompt = null, CancellationToken ct = default);
}

public class AiChatMessageDto
{
    public string Role { get; set; } = string.Empty; // "user", "assistant", "system"
    public string Content { get; set; } = string.Empty;
}
