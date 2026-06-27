using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Employees.Commands.ImportEmployees;

public class ImportEmployeesCommandHandler : IRequestHandler<ImportEmployeesCommand, ImportEmployeesResultDto>
{
    private readonly IApplicationDbContext _context;

    public ImportEmployeesCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ImportEmployeesResultDto> Handle(ImportEmployeesCommand request, CancellationToken cancellationToken)
    {
        var result = new ImportEmployeesResultDto();

        if (request.File == null || request.File.Length == 0)
        {
            result.Errors.Add("File không hợp lệ hoặc rỗng.");
            result.FailedCount = 1;
            return result;
        }

        // Đọc danh sách phòng ban để map tên phòng ban thành ID
        var departments = await _context.Departments.ToListAsync(cancellationToken);
        var deptDict = departments.ToDictionary(
            d => d.Name.Trim().ToLowerInvariant(),
            d => d.Id
        );

        // Lưu trữ mã nhân sự hiện có để kiểm tra trùng / update
        var existingEmployees = await _context.Employees.ToListAsync(cancellationToken);
        var empDict = existingEmployees.ToDictionary(
            e => e.EmployeeCode.Trim().ToLowerInvariant(),
            e => e
        );

        using var stream = request.File.OpenReadStream();
        using var reader = new StreamReader(stream, Encoding.UTF8);

        var headerLine = await reader.ReadLineAsync(cancellationToken);
        if (headerLine == null)
        {
            result.Errors.Add("File không có dữ liệu tiêu đề.");
            result.FailedCount = 1;
            return result;
        }

        // Định dạng ngày có thể chấp nhận
        string[] dateFormats = { "yyyy-MM-dd", "dd/MM/yyyy", "dd-MM-yyyy", "yyyy/MM/dd" };

        int rowNum = 1;
        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            rowNum++;

            if (string.IsNullOrWhiteSpace(line)) continue;

            var fields = ParseCsvLine(line);

            // Kiểm tra số lượng trường tối thiểu (cần ít nhất 12 cột thông tin)
            if (fields.Count < 12)
            {
                result.Errors.Add($"Dòng {rowNum}: Không đủ số lượng cột. Cần ít nhất 12 cột thông tin.");
                result.FailedCount++;
                continue;
            }

            var employeeCode = fields[0].Trim();
            var fullName = fields[1].Trim();
            var dobStr = fields[2].Trim();
            var genderStr = fields[3].Trim();
            var idCard = fields[4].Trim();
            var phone = fields[5].Trim();
            var email = fields[6].Trim();
            var address = fields[7].Trim();
            var deptName = fields[8].Trim();
            var position = fields[9].Trim();
            var hireDateStr = fields[10].Trim();
            var statusStr = fields[11].Trim();
            var origin = fields.Count > 12 ? fields[12].Trim() : null;
            var marital = fields.Count > 13 ? fields[13].Trim() : null;
            var oneOffice = fields.Count > 14 ? fields[14].Trim() : null;

            // Validate các trường bắt buộc
            if (string.IsNullOrEmpty(employeeCode))
            {
                result.Errors.Add($"Dòng {rowNum}: Mã nhân viên không được để trống.");
                result.FailedCount++;
                continue;
            }
            if (string.IsNullOrEmpty(fullName))
            {
                result.Errors.Add($"Dòng {rowNum}: Họ tên không được để trống.");
                result.FailedCount++;
                continue;
            }
            if (!DateTime.TryParseExact(dobStr, dateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dob))
            {
                result.Errors.Add($"Dòng {rowNum}: Ngày sinh '{dobStr}' không đúng định dạng (ví dụ: yyyy-MM-dd hoặc dd/MM/yyyy).");
                result.FailedCount++;
                continue;
            }
            if (!DateTime.TryParseExact(hireDateStr, dateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var hireDate))
            {
                result.Errors.Add($"Dòng {rowNum}: Ngày vào làm '{hireDateStr}' không đúng định dạng (ví dụ: yyyy-MM-dd hoặc dd/MM/yyyy).");
                result.FailedCount++;
                continue;
            }

            // Map phòng ban
            var deptKey = deptName.ToLowerInvariant();
            if (!deptDict.TryGetValue(deptKey, out int departmentId))
            {
                result.Errors.Add($"Dòng {rowNum}: Phòng ban '{deptName}' không tồn tại trong hệ thống.");
                result.FailedCount++;
                continue;
            }

            // Map Gender
            var gender = genderStr.ToLowerInvariant() switch
            {
                "nam" => Gender.Male,
                "nữ" => Gender.Female,
                "khác" => Gender.Other,
                _ => Gender.Other
            };

            // Map Status
            var status = statusStr.ToLowerInvariant() switch
            {
                "đang làm việc" => EmployeeStatus.Active,
                "đã nghỉ" => EmployeeStatus.Inactive,
                "đang nghỉ phép" => EmployeeStatus.OnLeave,
                _ => EmployeeStatus.Active
            };

            // Kiểm tra trùng / Update hay Insert
            var empKey = employeeCode.ToLowerInvariant();
            if (empDict.TryGetValue(empKey, out var employee))
            {
                // Cập nhật thông tin hiện tại
                employee.FullName = fullName;
                employee.DateOfBirth = dob;
                employee.Gender = gender;
                employee.IdCardNumber = idCard;
                employee.PhoneNumber = phone;
                employee.Email = email;
                employee.Address = string.IsNullOrEmpty(address) ? null : address;
                employee.DepartmentId = departmentId;
                employee.Position = position;
                employee.HireDate = hireDate;
                employee.Status = status;
                employee.PlaceOfOrigin = string.IsNullOrEmpty(origin) ? null : origin;
                employee.MaritalStatus = string.IsNullOrEmpty(marital) ? null : marital;
                employee.OneOfficeAccount = string.IsNullOrEmpty(oneOffice) ? null : oneOffice;

                _context.Employees.Update(employee);
            }
            else
            {
                // Thêm mới
                var newEmployee = new Employee
                {
                    EmployeeCode = employeeCode,
                    FullName = fullName,
                    DateOfBirth = dob,
                    Gender = gender,
                    IdCardNumber = idCard,
                    PhoneNumber = phone,
                    Email = email,
                    Address = string.IsNullOrEmpty(address) ? null : address,
                    DepartmentId = departmentId,
                    Position = position,
                    HireDate = hireDate,
                    Status = status,
                    PlaceOfOrigin = string.IsNullOrEmpty(origin) ? null : origin,
                    MaritalStatus = string.IsNullOrEmpty(marital) ? null : marital,
                    OneOfficeAccount = string.IsNullOrEmpty(oneOffice) ? null : oneOffice
                };

                _context.Employees.Add(newEmployee);
                empDict[empKey] = newEmployee; // Thêm vào dictionary tạm để tránh trùng mã trong cùng một file import
            }

            result.SuccessCount++;
        }

        if (result.SuccessCount > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        var inQuotes = false;
        var currentField = new StringBuilder();
        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    currentField.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(currentField.ToString());
                currentField.Clear();
            }
            else
            {
                currentField.Append(c);
            }
        }
        result.Add(currentField.ToString());
        return result;
    }
}
