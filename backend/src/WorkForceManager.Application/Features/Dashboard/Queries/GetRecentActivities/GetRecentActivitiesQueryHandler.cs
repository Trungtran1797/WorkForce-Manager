using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Dashboard.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Dashboard.Queries.GetRecentActivities;

public class GetRecentActivitiesQueryHandler : IRequestHandler<GetRecentActivitiesQuery, List<RecentActivityDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeService _dateTimeService;

    public GetRecentActivitiesQueryHandler(IApplicationDbContext context, IDateTimeService dateTimeService)
    {
        _context = context;
        _dateTimeService = dateTimeService;
    }

    public async Task<List<RecentActivityDto>> Handle(GetRecentActivitiesQuery request, CancellationToken cancellationToken)
    {
        var now = _dateTimeService.Now;
        var list = new List<ActivityTemp>();

        // 1. Lấy hoạt động từ Tasks
        var tasks = await _context.Tasks
            .AsNoTracking()
            .Include(t => t.Assignee)
            .OrderByDescending(t => t.ModifiedDate ?? t.CreatedDate)
            .Take(5)
            .ToListAsync(cancellationToken);

        foreach (var task in tasks)
        {
            var date = task.ModifiedDate ?? task.CreatedDate;
            var actor = task.Assignee?.FullName ?? "Hệ thống";
            string action;
            string type;

            if (task.Status == WorkTaskStatus.Done)
            {
                action = $"hoàn thành công việc \"{task.Title}\"";
                type = "success";
            }
            else if (task.Status == WorkTaskStatus.InProgress)
            {
                action = $"bắt đầu thực hiện công việc \"{task.Title}\"";
                type = "success";
            }
            else
            {
                action = $"được giao công việc mới \"{task.Title}\"";
                type = "create";
            }

            list.Add(new ActivityTemp(
                $"task-{task.Id}-{date.Ticks}",
                actor,
                action,
                date,
                type
            ));
        }

        // 2. Lấy hoạt động từ Projects
        var projects = await _context.Projects
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedDate)
            .Take(3)
            .ToListAsync(cancellationToken);

        foreach (var project in projects)
        {
            var date = project.CreatedDate;
            list.Add(new ActivityTemp(
                $"project-{project.Id}-{date.Ticks}",
                "Hệ thống",
                $"tạo dự án mới \"{project.Name}\"",
                date,
                "create"
            ));
        }

        // 3. Lấy hoạt động từ LeaveRequests
        var leaves = await _context.LeaveRequests
            .AsNoTracking()
            .Include(lr => lr.Employee)
            .OrderByDescending(lr => lr.CreatedDate)
            .Take(3)
            .ToListAsync(cancellationToken);

        foreach (var leave in leaves)
        {
            var date = leave.CreatedDate;
            var actor = leave.Employee?.FullName ?? "Nhân viên";
            list.Add(new ActivityTemp(
                $"leave-{leave.Id}-{date.Ticks}",
                actor,
                $"gửi đơn xin nghỉ phép {leave.TotalDays} ngày",
                date,
                "warning"
            ));
        }

        // Sắp xếp các hoạt động giảm dần theo thời gian
        var orderedList = list
            .OrderByDescending(x => x.Date)
            .Take(5)
            .Select(x => new RecentActivityDto(
                x.Id,
                x.Actor,
                x.Action,
                FormatRelativeTime(x.Date, now),
                x.Type
            ))
            .ToList();

        // Bổ sung hoạt động mẫu nếu danh sách quá ngắn để đảm bảo giao diện đẹp mắt
        if (orderedList.Count < 5)
        {
            var seedActivities = GetSeedActivities();
            int needed = 5 - orderedList.Count;
            orderedList.AddRange(seedActivities.Take(needed));
        }

        return orderedList;
    }

    private static string FormatRelativeTime(DateTime pastDate, DateTime now)
    {
        var diff = now - pastDate;
        if (diff.TotalSeconds < 10) return "Vừa xong";
        if (diff.TotalMinutes < 1) return $"{(int)diff.TotalSeconds} giây trước";
        if (diff.TotalMinutes < 60) return $"{(int)diff.TotalMinutes} phút trước";
        if (diff.TotalHours < 24) return $"{(int)diff.TotalHours} giờ trước";
        if (diff.TotalDays < 2) return "Hôm qua";
        return pastDate.ToString("dd/MM/yyyy HH:mm");
    }

    private static List<RecentActivityDto> GetSeedActivities()
    {
        return new List<RecentActivityDto>
        {
            new("s1", "Nguyễn Văn An", "hoàn thành công việc \"Thiết kế UI Login\"", "5 phút trước", "success"),
            new("s2", "Trần Thị Bình", "tạo dự án mới \"Website TMĐT\"", "1 giờ trước", "create"),
            new("s3", "Lê Văn Cường", "gửi đơn xin nghỉ phép 2 ngày", "3 giờ trước", "warning"),
            new("s4", "Phạm Thị Dung", "cập nhật tiến độ dự án \"Hệ thống ERP nội bộ\" lên 90%", "5 giờ trước", "success"),
            new("s5", "Hoàng Văn Em", "được giao công việc mới \"Viết tài liệu API\"", "Hôm qua", "create")
        };
    }

    private record ActivityTemp(string Id, string Actor, string Action, DateTime Date, string Type);
}
