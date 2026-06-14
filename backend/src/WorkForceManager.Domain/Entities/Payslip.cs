using WorkForceManager.Domain.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Domain.Entities;

/// <summary>Phiếu lương tháng của một nhân viên (kỳ lương dạng "yyyy-MM").</summary>
public class Payslip : BaseAuditableEntity
{
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public string Period { get; set; } = string.Empty;

    public int WorkingDays { get; set; }
    public int StandardWorkingDays { get; set; }
    public decimal OvertimeHours { get; set; }

    public decimal BaseSalary { get; set; }
    public decimal Allowance { get; set; }
    public decimal OvertimePay { get; set; }
    public decimal GrossSalary { get; set; }

    public decimal Insurance { get; set; }
    public decimal PersonalDeduction { get; set; }
    public decimal DependentDeduction { get; set; }
    public decimal TaxableIncome { get; set; }
    public decimal PersonalIncomeTax { get; set; }

    public decimal NetSalary { get; set; }

    public PayslipStatus Status { get; set; } = PayslipStatus.Draft;
    public DateTime GeneratedDate { get; set; }
    public DateTime? ApprovedDate { get; set; }

    public ICollection<PayslipItem> Items { get; set; } = new List<PayslipItem>();
}
