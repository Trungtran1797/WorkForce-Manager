using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.LeaveRequests.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.LeaveRequests.Queries.GetLeaveRequests;

public class GetLeaveRequestsQueryHandler : IRequestHandler<GetLeaveRequestsQuery, PaginatedList<LeaveRequestDto>>
{
    private readonly IApplicationDbContext _context;

    public GetLeaveRequestsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<LeaveRequestDto>> Handle(GetLeaveRequestsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.LeaveRequests
            .AsNoTracking()
            .Include(lr => lr.Employee)
            .AsQueryable();

        // Tìm kiếm theo tên/mã nhân viên
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(lr =>
                lr.Employee!.FullName.Contains(term) ||
                lr.Employee.EmployeeCode.Contains(term));
        }

        // Lọc theo trạng thái
        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<LeaveStatus>(request.Status, out var status))
        {
            query = query.Where(lr => lr.Status == status);
        }

        // Lọc theo loại nghỉ
        if (!string.IsNullOrWhiteSpace(request.LeaveType) && Enum.TryParse<LeaveType>(request.LeaveType, out var type))
        {
            query = query.Where(lr => lr.Type == type);
        }

        query = query.OrderByDescending(lr => lr.CreatedDate);

        var totalCount = await query.CountAsync(cancellationToken);
        var requests = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var items = requests.Select(lr => lr.ToDto()).ToList();

        return new PaginatedList<LeaveRequestDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
