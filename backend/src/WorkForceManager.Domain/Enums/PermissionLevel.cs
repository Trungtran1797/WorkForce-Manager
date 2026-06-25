namespace WorkForceManager.Domain.Enums;

/// <summary>
/// Mức quyền trên một module. So sánh bằng ordinal: level >= required nghĩa là đủ quyền.
/// </summary>
public enum PermissionLevel
{
    None = 0,
    View = 1,
    Edit = 2
}
