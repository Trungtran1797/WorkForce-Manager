using MediatR;
using WorkForceManager.Application.Features.Training.Common;

namespace WorkForceManager.Application.Features.Training.Commands.CompleteTraining;

/// <summary>Đánh dấu một lượt đăng ký đào tạo là hoàn thành (hoặc hủy), kèm mã chứng chỉ nếu có.</summary>
public record CompleteTrainingCommand(int EnrollmentId, string Status, string? CertificateCode) : IRequest<TrainingEnrollmentDto>;
