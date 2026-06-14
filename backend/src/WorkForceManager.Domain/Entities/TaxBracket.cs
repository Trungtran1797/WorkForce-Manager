using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

/// <summary>Bậc thuế thu nhập cá nhân (TNCN) lũy tiến từng phần, theo tháng.</summary>
public class TaxBracket : BaseAuditableEntity
{
    public int Order { get; set; }
    public decimal FromAmount { get; set; }
    /// <summary>Null = bậc cao nhất (không giới hạn trên).</summary>
    public decimal? ToAmount { get; set; }
    /// <summary>Thuế suất (vd. 0.05 = 5%).</summary>
    public decimal Rate { get; set; }
}
