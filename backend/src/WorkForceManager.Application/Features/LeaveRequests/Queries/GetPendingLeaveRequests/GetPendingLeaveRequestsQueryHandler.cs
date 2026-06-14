using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.LeaveRequests.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.LeaveRequests.Queries.GetPendingLeaveRequests;

public class GetPendingLeaveRequestsQueryHandler : IRequestHandler<GetPendingLeaveRequestsQuery, List<LeaveRequestDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetPendingLeaveRequestsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<LeaveRequestDto>> Handle(GetPendingLeaveRequestsQuery request, CancellationToken cancellationToken)
    {
        var userRole = _currentUserService.Role;
        if (userRole != UserRole.Manager && userRole != UserRole.SuperAdmin)
        {
            throw new ForbiddenAccessException("Bạn không có quyền xem các đơn xin nghỉ phép đang chờ duyệt.");
        }

        var query = _context.LeaveRequests
            .AsNoTracking()
            .Include(lr => lr.Employee)
            .AsQueryable();

        if (userRole == UserRole.Manager)
        {
            // Manager chỉ duyệt các đơn chờ Manager duyệt
            query = query.Where(lr => lr.Status == LeaveStatus.PendingManager);
        }
        else if (userRole == UserRole.SuperAdmin)
        {
            // SuperAdmin/HR duyệt các đơn chờ HR duyệt hoặc có thể duyệt thay cả Manager
            query = query.Where(lr => lr.Status == LeaveStatus.PendingManager || lr.Status == LeaveStatus.PendingHr);
        }

        var requests = await query
            .OrderByDescending(lr => lr.CreatedDate)
            .ToListAsync(cancellationToken);

        return requests.Select(lr => lr.ToDto()).ToList();
    }
}
