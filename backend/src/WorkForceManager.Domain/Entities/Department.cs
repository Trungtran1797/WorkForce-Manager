using WorkForceManager.Domain.Common;

namespace WorkForceManager.Domain.Entities;

public class Department : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Tên icon Lucide hiển thị ở frontend (code|briefcase|users|calculator|megaphone).</summary>
    public string Icon { get; set; } = "briefcase";

    /// <summary>Biến thể màu hiển thị ở frontend (primary|success|warning|destructive).</summary>
    public string ColorVariant { get; set; } = "primary";

    public int? ManagerId { get; set; }
    public Employee? Manager { get; set; }

    public int? ParentDepartmentId { get; set; }
    public Department? ParentDepartment { get; set; }
    public ICollection<Department> ChildDepartments { get; set; } = new List<Department>();

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
