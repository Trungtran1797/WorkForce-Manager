using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Training.Common;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Training.Commands.SaveCourse;

public class SaveCourseCommandHandler : IRequestHandler<SaveCourseCommand, TrainingCourseDto>
{
    private readonly IApplicationDbContext _context;

    public SaveCourseCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TrainingCourseDto> Handle(SaveCourseCommand request, CancellationToken cancellationToken)
    {
        TrainingCourse course;
        if (request.Id > 0)
        {
            course = await _context.TrainingCourses
                .Include(c => c.Enrollments)
                .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
                ?? throw new NotFoundException("Khóa đào tạo", request.Id);
        }
        else
        {
            course = new TrainingCourse();
            _context.TrainingCourses.Add(course);
        }

        course.Name = request.Name.Trim();
        course.Description = request.Description;
        course.Instructor = request.Instructor;
        course.StartDate = DateTime.Parse(request.StartDate).Date;
        course.EndDate = string.IsNullOrWhiteSpace(request.EndDate) ? null : DateTime.Parse(request.EndDate).Date;

        await _context.SaveChangesAsync(cancellationToken);

        var saved = await _context.TrainingCourses
            .AsNoTracking()
            .Include(c => c.Enrollments)
            .ThenInclude(e => e.Employee)
            .FirstAsync(c => c.Id == course.Id, cancellationToken);

        return saved.ToDto();
    }
}
