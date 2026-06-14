namespace WorkForceManager.Domain.Entities;

public class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    /// <summary>Loại thông báo: task|deadline|overdue|leave|system.</summary>
    public string Type { get; set; } = "system";

    public bool IsRead { get; set; }
    public string? Link { get; set; }
    public DateTime CreatedAt { get; set; }
}
