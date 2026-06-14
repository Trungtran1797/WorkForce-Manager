using Microsoft.EntityFrameworkCore;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Common.Interfaces;

/// <summary>
/// Abstraction của DbContext cho Application layer. Query (read-only) dùng trực tiếp
/// các DbSet với AsNoTracking; Command dùng IUnitOfWork/IRepository để ghi.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<Department> Departments { get; }
    DbSet<Employee> Employees { get; }
    DbSet<Project> Projects { get; }
    DbSet<ProjectMember> ProjectMembers { get; }
    DbSet<TaskItem> Tasks { get; }
    DbSet<Attendance> Attendances { get; }
    DbSet<LeaveRequest> LeaveRequests { get; }
    DbSet<Shift> Shifts { get; }
    DbSet<ShiftAssignment> ShiftAssignments { get; }
    DbSet<OvertimeRequest> OvertimeRequests { get; }
    DbSet<OfficeLocation> OfficeLocations { get; }
    DbSet<EmploymentContract> EmploymentContracts { get; }
    DbSet<SalaryConfig> SalaryConfigs { get; }
    DbSet<TaxBracket> TaxBrackets { get; }
    DbSet<Payslip> Payslips { get; }
    DbSet<PayslipItem> PayslipItems { get; }
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<OkrObjective> OkrObjectives { get; }
    DbSet<KeyResult> KeyResults { get; }
    DbSet<PerformanceReview> PerformanceReviews { get; }
    DbSet<ReviewCriterion> ReviewCriteria { get; }
    DbSet<TrainingCourse> TrainingCourses { get; }
    DbSet<TrainingEnrollment> TrainingEnrollments { get; }
    DbSet<ProjectComment> ProjectComments { get; }
    DbSet<ProjectAttachment> ProjectAttachments { get; }
    DbSet<TaskComment> TaskComments { get; }
    DbSet<TaskAttachment> TaskAttachments { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
