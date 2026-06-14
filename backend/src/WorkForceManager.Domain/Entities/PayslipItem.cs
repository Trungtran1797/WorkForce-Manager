using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

/// <summary>Dòng chi tiết trong phiếu lương (khoản cộng/trừ).</summary>
public class PayslipItem : BaseAuditableEntity
{
    public int PayslipId { get; set; }
    public Payslip? Payslip { get; set; }

    public string Label { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    /// <summary>True = khoản cộng (thu nhập), False = khoản trừ (khấu trừ).</summary>
    public bool IsEarning { get; set; }
}
