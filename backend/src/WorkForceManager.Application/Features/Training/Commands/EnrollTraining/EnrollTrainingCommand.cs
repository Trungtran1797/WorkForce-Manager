using MediatR;
using WorkForceManager.Application.Features.Training.Common;

namespace WorkForceManager.Application.Features.Training.Commands.EnrollTraining;

/// <summary>Đăng ký một nhân viên tham gia khóa đào tạo.</summary>
public record EnrollTrainingCommand(int CourseId, int EmployeeId) : IRequest<TrainingEnrollmentDto>;
