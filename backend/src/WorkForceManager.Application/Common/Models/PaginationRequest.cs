namespace WorkForceManager.Application.Common.Models;

/// <summary>Tham số chung cho mọi query list: phân trang, tìm kiếm, sắp xếp.</summary>
public abstract class PaginationRequest
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;
    private int _pageNumber = 1;

    public int PageNumber
    {
        get => _pageNumber;
        set => _pageNumber = value < 1 ? 1 : value;
    }

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value is < 1 or > MaxPageSize ? 20 : value;
    }

    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public string? SortDirection { get; set; } = "desc";

    public bool IsDescending => !string.Equals(SortDirection, "asc", StringComparison.OrdinalIgnoreCase);
}
