using MediatR;
using WorkForceManager.Application.Features.Training.Common;

namespace WorkForceManager.Application.Features.Training.Queries.GetCourses;

/// <summary>Lấy danh sách khóa đào tạo kèm danh sách đăng ký.</summary>
public record GetCoursesQuery : IRequest<List<TrainingCourseDto>>;
