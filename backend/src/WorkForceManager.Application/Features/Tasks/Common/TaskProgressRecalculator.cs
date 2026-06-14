using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Features.Tasks.Common;

public static class TaskProgressRecalculator
{
    /// <summary>
    /// Đồng bộ % hoàn thành của công việc cha = trung bình % hoàn thành các công việc con.
    /// Không thay đổi nếu công việc cha không còn công việc con nào.
    /// Thay đổi được tracking trên context, caller chịu trách nhiệm gọi SaveChangesAsync.
    /// </summary>
    public static async Task RecalculateParentAsync(
        IApplicationDbContext context,
        int parentTaskId,
        CancellationToken cancellationToken,
        int? excludeTaskId = null)
    {
        var query = context.Tasks.Where(t => t.ParentTaskId == parentTaskId);
        if (excludeTaskId.HasValue)
        {
            query = query.Where(t => t.Id != excludeTaskId.Value);
        }

        var subTasks = await query.ToListAsync(cancellationToken);
        if (subTasks.Count == 0)
        {
            return;
        }

        var parent = await context.Tasks
            .FirstOrDefaultAsync(t => t.Id == parentTaskId, cancellationToken);

        if (parent is null)
        {
            return;
        }

        parent.Progress = (int)Math.Round(subTasks.Average(t => t.Progress));
    }
}
