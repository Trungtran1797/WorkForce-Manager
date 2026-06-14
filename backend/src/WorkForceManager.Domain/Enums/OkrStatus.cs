namespace WorkForceManager.Domain.Enums;

public enum OkrStatus
{
    Draft,
    Active,
    Achieved,
    Failed
}

/// <summary>Chủ thể sở hữu mục tiêu OKR: phòng ban hoặc cá nhân.</summary>
public enum OkrOwnerType
{
    Department,
    Individual
}
