namespace WorkForceManager.Domain.Common;

/// <summary>
/// Base cho mọi entity nghiệp vụ: khóa chính, audit log và soft delete.
/// Audit fields được set tự động qua SaveChangesInterceptor (Infrastructure).
/// </summary>
public abstract class BaseAuditableEntity
{
    public int Id { get; set; }

    public DateTime CreatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public string? ModifiedBy { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedDate { get; set; }
    public string? DeletedBy { get; set; }
}
