using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Tasks.Discussions.Common;

/// <summary>
/// Quy tắc phân quyền truy cập bảng thảo luận của Task: được phép nếu là
/// AssigneeId, AssignerId, thành viên của Project chứa task (nếu có), hoặc Manager/SuperAdmin.
/// </summary>
public static class TaskDiscussionAccess
{
    public static bool CanAccess(TaskItem task, int? employeeId, UserRole? role)
    {
        var canManage = role is UserRole.SuperAdmin or UserRole.Manager;
        if (canManage)
        {
            return true;
        }

        if (employeeId is null)
        {
            return false;
        }

        if (task.AssigneeId == employeeId || task.AssignerId == employeeId)
        {
            return true;
        }

        if (task.Project is not null)
        {
            return task.Project.Members.Any(m => m.EmployeeId == employeeId.Value);
        }

        return false;
    }
}
