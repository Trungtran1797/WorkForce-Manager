using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Employees.Queries.ExportEmployees;

public class ExportEmployeesQueryHandler : IRequestHandler<ExportEmployeesQuery, ExportEmployeesResultDto>
{
    private readonly IApplicationDbContext _context;

    public ExportEmployeesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ExportEmployeesResultDto> Handle(ExportEmployeesQuery request, CancellationToken cancellationToken)
    {
        var headers = new[]
        {
            "Mã NV", "Họ tên", "Ngày sinh", "Giới tính", "CCCD", "Điện thoại", "Email", "Địa chỉ",
            "Phòng ban", "Chức vụ", "Ngày vào làm", "Trạng thái", "Nguyên quán", "Hôn nhân", "Tài khoản 1Office"
        };

        var csvBuilder = new StringBuilder();
        csvBuilder.AppendLine(string.Join(",", headers));

        if (!request.TemplateOnly)
        {
            var employees = await _context.Employees
                .AsNoTracking()
                .Include(e => e.Department)
                .OrderBy(e => e.EmployeeCode)
                .ToListAsync(cancellationToken);

            foreach (var e in employees)
            {
                var genderStr = e.Gender switch
                {
                    Gender.Male => "Nam",
                    Gender.Female => "Nữ",
                    Gender.Other => "Khác",
                    _ => "Khác"
                };

                var statusStr = e.Status switch
                {
                    EmployeeStatus.Active => "Đang làm việc",
                    EmployeeStatus.Inactive => "Đã nghỉ",
                    EmployeeStatus.OnLeave => "Đang nghỉ phép",
                    _ => "Đang làm việc"
                };

                var row = new[]
                {
                    e.EmployeeCode,
                    e.FullName,
                    e.DateOfBirth.ToString("yyyy-MM-dd"),
                    genderStr,
                    e.IdCardNumber,
                    e.PhoneNumber,
                    e.Email,
                    e.Address ?? string.Empty,
                    e.Department?.Name ?? string.Empty,
                    e.Position,
                    e.HireDate.ToString("yyyy-MM-dd"),
                    statusStr,
                    e.PlaceOfOrigin ?? string.Empty,
                    e.MaritalStatus ?? string.Empty,
                    e.OneOfficeAccount ?? string.Empty
                };

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
        }
        else
        {
            // Thêm một dòng mẫu để người dùng dễ hiểu cách điền dữ liệu
            var sampleRow = new[]
            {
                "NV001", "Nguyễn Văn An", "1990-01-01", "Nam", "012345678912", "0987654321",
                "an.nguyen@workforce.local", "Hà Nội", "Phòng Kinh doanh", "Trưởng phòng Kinh doanh",
                "2026-01-01", "Đang làm việc", "Hà Nội", "Độc thân", "an.nguyen.1office"
            };

            var escapedRow = sampleRow.Select(cell =>
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

        var fileName = request.TemplateOnly ? "Mau_Import_NhanVien.csv" : "DanhSach_NhanVien.csv";

        return new ExportEmployeesResultDto(
            fileName,
            "text/csv; charset=utf-8",
            fileBytes
        );
    }
}
