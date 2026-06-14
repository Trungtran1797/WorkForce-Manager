using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Attendances.Common;

namespace WorkForceManager.Application.Features.Attendances.Queries.GetAttendances;

public class GetAttendancesQueryHandler : IRequestHandler<GetAttendancesQuery, PaginatedList<AttendanceDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAttendancesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<AttendanceDto>> Handle(GetAttendancesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Attendances
            .AsNoTracking()
            .Include(a => a.Employee)
                .ThenInclude(e => e.Department)
            .AsQueryable();

        // Tìm kiếm theo tên/mã nhân viên
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(a =>
                a.Employee!.FullName.Contains(term) ||
                a.Employee!.EmployeeCode.Contains(term));
        }

        // Lọc theo phòng ban
        if (request.DepartmentId is { } deptId)
        {
            query = query.Where(a => a.Employee!.DepartmentId == deptId);
        }

        // Lọc theo khoảng thời gian
        if (!string.IsNullOrWhiteSpace(request.StartDate) && DateTime.TryParse(request.StartDate, out var start))
        {
            query = query.Where(a => a.Date >= start.Date);
        }

        if (!string.IsNullOrWhiteSpace(request.EndDate) && DateTime.TryParse(request.EndDate, out var end))
        {
            query = query.Where(a => a.Date <= end.Date);
        }

        // Sắp xếp mặc định: ngày giảm dần, sau đó đến giờ check in giảm dần
        query = query.OrderByDescending(a => a.Date)
                     .ThenByDescending(a => a.CheckInTime);

        var totalCount = await query.CountAsync(cancellationToken);
        var attendances = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var items = attendances.Select(a => a.ToDto()).ToList();

        return new PaginatedList<AttendanceDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
