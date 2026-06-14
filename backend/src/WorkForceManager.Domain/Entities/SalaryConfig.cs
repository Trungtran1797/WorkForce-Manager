using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

/// <summary>Cấu hình lương hiện hành cho từng nhân viên (dùng khi tính bảng lương).</summary>
public class SalaryConfig : BaseAuditableEntity
{
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public decimal BaseSalary { get; set; }
    public decimal Allowance { get; set; }
    public decimal InsuranceSalary { get; set; }

    /// <summary>Số người phụ thuộc (giảm trừ gia cảnh khi tính thuế TNCN).</summary>
    public int DependentCount { get; set; }
}
