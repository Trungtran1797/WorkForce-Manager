using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

/// <summary>Đăng ký tham gia khóa đào tạo của một nhân viên.</summary>
public class TrainingEnrollment : BaseAuditableEntity
{
    public int CourseId { get; set; }
    public TrainingCourse? Course { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public TrainingStatus Status { get; set; } = TrainingStatus.Enrolled;
    public DateTime? CompletedDate { get; set; }
    public string? CertificateCode { get; set; }
}
