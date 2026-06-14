using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

/// <summary>Hồ sơ hợp đồng lao động (thử việc, chính thức, phụ lục).</summary>
public class EmploymentContract : BaseAuditableEntity
{
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public string ContractCode { get; set; } = string.Empty;
    public ContractType ContractType { get; set; } = ContractType.Probation;

    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public decimal BaseSalary { get; set; }
    public decimal Allowance { get; set; }
    /// <summary>Mức lương đóng bảo hiểm (thường ≤ lương cơ bản theo quy định).</summary>
    public decimal InsuranceSalary { get; set; }

    public ContractStatus Status { get; set; } = ContractStatus.Active;
    public string? FileUrl { get; set; }

    /// <summary>Hợp đồng gốc nếu đây là phụ lục.</summary>
    public int? ParentContractId { get; set; }
    public EmploymentContract? ParentContract { get; set; }
}
