namespace WorkForceManager.Domain.Enums;

/// <summary>Loại đánh giá trong chu trình 360 độ.</summary>
public enum ReviewType
{
    Self,
    Manager,
    Peer
}

public enum ReviewStatus
{
    Pending,
    Submitted,
    Completed
}

/// <summary>Mức xếp loại hiệu suất tổng thể.</summary>
public enum RatingLevel
{
    Poor,
    Average,
    Good,
    Excellent
}

/// <summary>Trạng thái tham gia khóa đào tạo.</summary>
public enum TrainingStatus
{
    Enrolled,
    Completed,
    Cancelled
}
