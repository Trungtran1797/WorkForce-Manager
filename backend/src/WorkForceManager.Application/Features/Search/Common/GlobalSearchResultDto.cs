namespace WorkForceManager.Application.Features.Search.Common;

public class GlobalSearchResultDto
{
    public List<SearchResultItemDto> Employees { get; set; } = [];
    public List<SearchResultItemDto> Departments { get; set; } = [];
    public List<SearchResultItemDto> Projects { get; set; } = [];
    public List<SearchResultItemDto> Tasks { get; set; } = [];
}

public class SearchResultItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Subtitle { get; set; }
}
