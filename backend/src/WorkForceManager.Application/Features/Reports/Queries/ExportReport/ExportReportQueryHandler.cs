using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Reports.Queries.ExportReport;

public class ExportReportQueryHandler : IRequestHandler<ExportReportQuery, ExportReportResultDto>
{
    private readonly IApplicationDbContext _context;

    public ExportReportQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ExportReportResultDto> Handle(ExportReportQuery request, CancellationToken cancellationToken)
    {
        var format = request.Format?.ToLowerInvariant() == "pdf" ? "pdf" : "excel";

        return request.ReportId switch
        {
            "report-employee-performance" => await ExportEmployeePerformanceAsync(format, cancellationToken),
            "report-project-progress" => await ExportProjectProgressAsync(format, cancellationToken),
            "report-task-completion" => await ExportTaskCompletionAsync(format, cancellationToken),
            "report-department-statistics" => await ExportDepartmentStatisticsAsync(format, cancellationToken),
            "report-attendance" => await ExportAttendanceAsync(format, cancellationToken),
            _ => throw new NotFoundException("Báo cáo", request.ReportId)
        };
    }

    private async Task<ExportReportResultDto> ExportEmployeePerformanceAsync(string format, CancellationToken ct)
    {
        var employees = await _context.Employees
            .AsNoTracking()
            .Include(e => e.Department)
            .ToListAsync(ct);

        var tasks = await _context.Tasks
            .AsNoTracking()
            .ToListAsync(ct);

        var title = "Báo cáo hiệu suất nhân viên";
        var headersList = new[] { "Mã NV", "Họ Tên", "Phòng Ban", "Chức Vụ", "Số Việc Giao", "Số Việc Xong", "Tỷ Lệ Xong (%)" };

        var rowsData = new List<string[]>();
        foreach (var emp in employees)
        {
            var total = tasks.Count(t => t.AssigneeId == emp.Id);
            var completed = tasks.Count(t => t.AssigneeId == emp.Id && t.Status == WorkTaskStatus.Done);
            var rateStr = total > 0 ? $"{(int)((double)completed / total * 100)}%" : "0%";

            rowsData.Add(new[]
            {
                emp.EmployeeCode,
                emp.FullName,
                emp.Department?.Name ?? string.Empty,
                emp.Position,
                total.ToString(),
                completed.ToString(),
                rateStr
            });
        }

        return GenerateFile(format, title, headersList, rowsData, "BaoCaoHieuSuatNhanVien");
    }

    private async Task<ExportReportResultDto> ExportProjectProgressAsync(string format, CancellationToken ct)
    {
        var projects = await _context.Projects
            .AsNoTracking()
            .ToListAsync(ct);

        var title = "Báo cáo tiến độ dự án";
        var headersList = new[] { "Mã Dự Án", "Tên Dự Án", "Chủ Đầu Tư", "Ngày Bắt Đầu", "Ngày Kết Thúc", "Ngân Sách (VNĐ)", "Tiến Độ (%)", "Trạng Thái" };

        var rowsData = new List<string[]>();
        foreach (var p in projects)
        {
            rowsData.Add(new[]
            {
                p.Code,
                p.Name,
                p.Investor ?? string.Empty,
                p.StartDate.ToString("yyyy-MM-dd"),
                p.EndDate.ToString("yyyy-MM-dd"),
                p.Budget.ToString("N0"),
                $"{p.Progress}%",
                p.Status.ToString()
            });
        }

        return GenerateFile(format, title, headersList, rowsData, "BaoCaoTienDoDuAn");
    }

    private async Task<ExportReportResultDto> ExportTaskCompletionAsync(string format, CancellationToken ct)
    {
        var tasks = await _context.Tasks
            .AsNoTracking()
            .ToListAsync(ct);

        var title = "Báo cáo tỷ lệ hoàn thành công việc";
        var headersList = new[] { "Trạng Thái", "Số Lượng", "Tỷ Lệ (%)" };

        var total = tasks.Count;
        var rowsData = new List<string[]>();

        foreach (WorkTaskStatus status in Enum.GetValues(typeof(WorkTaskStatus)))
        {
            var count = tasks.Count(t => t.Status == status);
            var rateStr = total > 0 ? $"{(int)((double)count / total * 100)}%" : "0%";
            rowsData.Add(new[] { status.ToString(), count.ToString(), rateStr });
        }

        return GenerateFile(format, title, headersList, rowsData, "BaoCaoTyLeHoanThanhCongViec");
    }

    private async Task<ExportReportResultDto> ExportDepartmentStatisticsAsync(string format, CancellationToken ct)
    {
        var departments = await _context.Departments
            .AsNoTracking()
            .Include(d => d.Manager)
            .ToListAsync(ct);

        var employees = await _context.Employees
            .AsNoTracking()
            .ToListAsync(ct);

        var title = "Báo cáo thống kê phòng ban";
        var headersList = new[] { "Tên Phòng Ban", "Trưởng Phòng", "Số Nhân Sự", "Mô Tả" };

        var rowsData = new List<string[]>();
        foreach (var d in departments)
        {
            var count = employees.Count(e => e.DepartmentId == d.Id);
            rowsData.Add(new[]
            {
                d.Name,
                d.Manager?.FullName ?? "Chưa bổ nhiệm",
                count.ToString(),
                d.Description ?? string.Empty
            });
        }

        return GenerateFile(format, title, headersList, rowsData, "BaoCaoThongKePhongBan");
    }

    private async Task<ExportReportResultDto> ExportAttendanceAsync(string format, CancellationToken ct)
    {
        var attendances = await _context.Attendances
            .AsNoTracking()
            .Include(a => a.Employee)
            .OrderByDescending(a => a.Date)
            .ToListAsync(ct);

        var title = "Báo cáo tổng hợp chấm công";
        var headersList = new[] { "Mã NV", "Họ Tên", "Ngày", "Check In", "Check Out", "Số Giờ Làm", "Trạng Thái", "Ghi Chú" };

        var rowsData = new List<string[]>();
        foreach (var a in attendances)
        {
            rowsData.Add(new[]
            {
                a.Employee?.EmployeeCode ?? string.Empty,
                a.Employee?.FullName ?? string.Empty,
                a.Date.ToString("yyyy-MM-dd"),
                a.CheckInTime?.ToString("HH:mm:ss") ?? "—",
                a.CheckOutTime?.ToString("HH:mm:ss") ?? "—",
                a.WorkingHours?.ToString("F1") ?? "—",
                a.Status.ToString(),
                a.Note ?? string.Empty
            });
        }

        return GenerateFile(format, title, headersList, rowsData, "BaoCaoTongHopChamCong");
    }

    private static ExportReportResultDto GenerateFile(string format, string title, string[] headers, List<string[]> rows, string fileBaseName)
    {
        if (format == "pdf")
        {
            // Trả về file HTML để in ra PDF
            var headersBuilder = new StringBuilder();
            foreach (var h in headers)
            {
                headersBuilder.Append($"<th>{h}</th>");
            }

            var rowsBuilder = new StringBuilder();
            foreach (var row in rows)
            {
                rowsBuilder.Append("<tr>");
                foreach (var cell in row)
                {
                    rowsBuilder.Append($"<td>{cell}</td>");
                }
                rowsBuilder.Append("</tr>");
            }

            var htmlContent = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"" />
    <title>{title}</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #333; }}
        h1 {{ text-align: center; color: #2563EB; margin-bottom: 5px; }}
        .subtitle {{ text-align: center; color: #666; font-size: 14px; margin-bottom: 30px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }}
        th, td {{ border: 1px solid #E5E7EB; padding: 10px 12px; text-align: left; }}
        th {{ background-color: #F3F4F6; color: #374151; font-weight: 600; }}
        tr:nth-child(even) {{ background-color: #F9FAFB; }}
        .footer {{ text-align: center; margin-top: 40px; font-size: 11px; color: #9CA3AF; }}
        @media print {{
            body {{ margin: 20px; }}
        }}
    </style>
</head>
<body>
    <h1>{title}</h1>
    <div class=""subtitle"">Hệ thống WorkForce Manager • Xuất bản lúc {DateTime.Now:dd/MM/yyyy HH:mm:ss}</div>
    <table>
        <thead>
            <tr>{headersBuilder}</tr>
        </thead>
        <tbody>
            {rowsBuilder}
        </tbody>
    </table>
    <div class=""footer"">Tài liệu nội bộ • Bản quyền © {DateTime.Now.Year} WorkForce Manager</div>
    <script>
        window.onload = function() {{
            setTimeout(function() {{
                window.print();
            }}, 500);
        }};
    </script>
</body>
</html>";

            var fileBytes = Encoding.UTF8.GetBytes(htmlContent);
            return new ExportReportResultDto(
                $"{fileBaseName}.html",
                "text/html; charset=utf-8",
                fileBytes
            );
        }
        else
        {
            // Trả về file CSV (với BOM để Excel đọc được tiếng Việt)
            var csvBuilder = new StringBuilder();
            csvBuilder.AppendLine(string.Join(",", headers));

            foreach (var row in rows)
            {
                // Escape commas in cells
                var escapedRow = row.Select(cell => 
                {
                    if (cell.Contains(",") || cell.Contains("\"") || cell.Contains("\n"))
                    {
                        return $"\"{cell.Replace("\"", "\"\"")}\"";
                    }
                    return cell;
                });
                csvBuilder.AppendLine(string.Join(",", escapedRow));
            }

            var csvString = csvBuilder.ToString();
            var bytesWithoutBom = Encoding.UTF8.GetBytes(csvString);
            
            // UTF-8 BOM
            var fileBytes = new byte[bytesWithoutBom.Length + 3];
            fileBytes[0] = 0xEF;
            fileBytes[1] = 0xBB;
            fileBytes[2] = 0xBF;
            Buffer.BlockCopy(bytesWithoutBom, 0, fileBytes, 3, bytesWithoutBom.Length);

            return new ExportReportResultDto(
                $"{fileBaseName}.csv",
                "text/csv; charset=utf-8",
                fileBytes
            );
        }
    }
}
