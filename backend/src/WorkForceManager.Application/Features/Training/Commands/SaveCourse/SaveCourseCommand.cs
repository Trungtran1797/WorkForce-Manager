using MediatR;
using WorkForceManager.Application.Features.Training.Common;

namespace WorkForceManager.Application.Features.Training.Commands.SaveCourse;

/// <summary>Tạo mới (Id = 0) hoặc cập nhật (Id &gt; 0) khóa đào tạo nội bộ.</summary>
public record SaveCourseCommand(
    int Id,
    string Name,
    string? Description,
    string? Instructor,
    string StartDate,
    string? EndDate) : IRequest<TrainingCourseDto>;
