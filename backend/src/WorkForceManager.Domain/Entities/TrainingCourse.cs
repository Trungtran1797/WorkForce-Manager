using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

/// <summary>Khóa đào tạo nội bộ / chứng chỉ chuyên môn.</summary>
public class TrainingCourse : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Instructor { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public ICollection<TrainingEnrollment> Enrollments { get; set; } = new List<TrainingEnrollment>();
}
