using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Tasks.Common;

/// <summary>
/// Chỉ Người thực hiện, Người giao việc, Admin hoặc Manager mới được chỉnh sửa
/// (đổi trạng thái, % hoàn thành, sửa thông tin, xóa) một công việc.
/// </summary>
public static class TaskPermission
{
    public static bool CanEdit(TaskItem task, ICurrentUserService currentUserService)
    {
        var role = currentUserService.Role;
        if (role == UserRole.SuperAdmin || role == UserRole.Manager)
        {
            return true;
        }

        var employeeId = currentUserService.EmployeeId;
        return employeeId.HasValue
            && (task.AssigneeId == employeeId || task.AssignerId == employeeId);
    }
}
