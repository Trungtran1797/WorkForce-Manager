using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Training.Common;

public record TrainingEnrollmentDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    string Status,
    string? CompletedDate,
    string? CertificateCode);

public record TrainingCourseDto(
    int Id,
    string Name,
    string? Description,
    string? Instructor,
    string StartDate,
    string? EndDate,
    IReadOnlyList<TrainingEnrollmentDto> Enrollments);

public static class TrainingMapping
{
    private const string DateFormat = "yyyy-MM-dd";

    public static TrainingEnrollmentDto ToDto(this TrainingEnrollment e) => new(
        e.Id,
        e.EmployeeId,
        e.Employee?.FullName ?? string.Empty,
        e.Status.ToString(),
        e.CompletedDate?.ToString(DateFormat),
        e.CertificateCode);

    public static TrainingCourseDto ToDto(this TrainingCourse c) => new(
        c.Id,
        c.Name,
        c.Description,
        c.Instructor,
        c.StartDate.ToString(DateFormat),
        c.EndDate?.ToString(DateFormat),
        c.Enrollments.OrderBy(e => e.Id).Select(e => e.ToDto()).ToList());
}
