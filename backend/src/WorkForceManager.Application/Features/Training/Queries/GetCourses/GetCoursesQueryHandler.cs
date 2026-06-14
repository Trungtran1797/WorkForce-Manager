using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Training.Common;

namespace WorkForceManager.Application.Features.Training.Queries.GetCourses;

public class GetCoursesQueryHandler : IRequestHandler<GetCoursesQuery, List<TrainingCourseDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCoursesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TrainingCourseDto>> Handle(GetCoursesQuery request, CancellationToken cancellationToken)
    {
        var courses = await _context.TrainingCourses
            .AsNoTracking()
            .Include(c => c.Enrollments)
            .ThenInclude(e => e.Employee)
            .OrderByDescending(c => c.StartDate)
            .ToListAsync(cancellationToken);

        return courses.Select(c => c.ToDto()).ToList();
    }
}
