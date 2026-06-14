using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Training.Common;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Training.Commands.EnrollTraining;

public class EnrollTrainingCommandHandler : IRequestHandler<EnrollTrainingCommand, TrainingEnrollmentDto>
{
    private readonly IApplicationDbContext _context;

    public EnrollTrainingCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TrainingEnrollmentDto> Handle(EnrollTrainingCommand request, CancellationToken cancellationToken)
    {
        _ = await _context.TrainingCourses.FirstOrDefaultAsync(c => c.Id == request.CourseId, cancellationToken)
            ?? throw new NotFoundException("Khóa đào tạo", request.CourseId);

        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken)
            ?? throw new NotFoundException("Nhân viên", request.EmployeeId);

        if (await _context.TrainingEnrollments.AnyAsync(
                e => e.CourseId == request.CourseId && e.EmployeeId == request.EmployeeId, cancellationToken))
        {
            throw new ConflictException("Nhân viên đã đăng ký khóa đào tạo này.");
        }

        var enrollment = new TrainingEnrollment
        {
            CourseId = request.CourseId,
            EmployeeId = request.EmployeeId
        };

        _context.TrainingEnrollments.Add(enrollment);
        await _context.SaveChangesAsync(cancellationToken);

        enrollment.Employee = employee;
        return enrollment.ToDto();
    }
}
