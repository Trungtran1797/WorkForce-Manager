namespace WorkForceManager.Application.Features.Reports.Queries.ExportReport;

public record ExportReportResultDto(
    string FileName,
    string ContentType,
    byte[] FileContents);
