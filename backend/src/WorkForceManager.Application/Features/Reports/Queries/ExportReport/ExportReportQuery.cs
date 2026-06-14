using MediatR;

namespace WorkForceManager.Application.Features.Reports.Queries.ExportReport;

public record ExportReportQuery(string ReportId, string Format) : IRequest<ExportReportResultDto>;
