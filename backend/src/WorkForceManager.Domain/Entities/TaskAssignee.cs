namespace WorkForceManager.Domain.Entities;

public class TaskAssignee
{
    public int TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;

    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
}
