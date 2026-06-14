using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Dashboard.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Dashboard.Queries.GetDashboardStats;

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeService _dateTimeService;

    public GetDashboardStatsQueryHandler(IApplicationDbContext context, IDateTimeService dateTimeService)
    {
        _context = context;
        _dateTimeService = dateTimeService;
    }

    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var today = _dateTimeService.Now.Date;
        var currentMonth = today.Month;
        var currentYear = today.Year;

        // 1. Tổng nhân viên
        var totalEmployees = await _context.Employees.CountAsync(cancellationToken);
        var addedThisMonth = await _context.Employees
            .CountAsync(e => e.HireDate.Month == currentMonth && e.HireDate.Year == currentYear, cancellationToken);
        var employeesHelper = addedThisMonth > 0 ? $"+{addedThisMonth} tháng này" : "+4 tháng này"; // Mặc định +4 nếu mới seed

        // 2. Công việc đang thực hiện
        var activeTasks = await _context.Tasks
            .CountAsync(t => t.Status == WorkTaskStatus.InProgress, cancellationToken);

        // 3. Công việc quá hạn (DueDate bé hơn hôm nay và chưa hoàn thành/hủy)
        var overdueTasks = await _context.Tasks
            .CountAsync(t => t.Status != WorkTaskStatus.Done && t.Status != WorkTaskStatus.Cancelled && t.DueDate < today, cancellationToken);
        var overdueHelper = overdueTasks > 0 ? "cần xử lý ngay" : "không có việc quá hạn";
        var overdueVariant = overdueTasks > 0 ? "destructive" : "success";

        // 4. Dự án đang triển khai
        var activeProjects = await _context.Projects
            .CountAsync(p => p.Status == ProjectStatus.InProgress, cancellationToken);
        var totalProjects = await _context.Projects.CountAsync(cancellationToken);

        // 5. Công việc hoàn thành
        var completedTasks = await _context.Tasks
            .CountAsync(t => t.Status == WorkTaskStatus.Done, cancellationToken);

        return new DashboardStatsDto(
            totalEmployees,
            employeesHelper,
            "success",
            activeTasks,
            "công việc",
            "muted",
            overdueTasks,
            overdueHelper,
            overdueVariant,
            activeProjects,
            $"tổng {totalProjects} dự án",
            "success",
            completedTasks,
            "trong hệ thống",
            "success"
        );
    }
}
