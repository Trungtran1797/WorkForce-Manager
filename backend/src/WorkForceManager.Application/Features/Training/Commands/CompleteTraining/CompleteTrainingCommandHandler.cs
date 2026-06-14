using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Training.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Training.Commands.CompleteTraining;

public class CompleteTrainingCommandHandler : IRequestHandler<CompleteTrainingCommand, TrainingEnrollmentDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeService _dateTimeService;

    public CompleteTrainingCommandHandler(IApplicationDbContext context, IDateTimeService dateTimeService)
    {
        _context = context;
        _dateTimeService = dateTimeService;
    }

    public async Task<TrainingEnrollmentDto> Handle(CompleteTrainingCommand request, CancellationToken cancellationToken)
    {
        var enrollment = await _context.TrainingEnrollments
            .Include(e => e.Employee)
            .FirstOrDefaultAsync(e => e.Id == request.EnrollmentId, cancellationToken)
            ?? throw new NotFoundException("Đăng ký đào tạo", request.EnrollmentId);

        var status = Enum.Parse<TrainingStatus>(request.Status);
        enrollment.Status = status;
        enrollment.CertificateCode = request.CertificateCode;
        enrollment.CompletedDate = status == TrainingStatus.Completed ? _dateTimeService.UtcNow : null;

        await _context.SaveChangesAsync(cancellationToken);

        return enrollment.ToDto();
    }
}
