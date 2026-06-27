using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Employees.Common;

namespace WorkForceManager.Application.Features.Employees.Queries.GetMyProfile;

public record GetMyProfileQuery : IRequest<EmployeeDto>;

public class GetMyProfileQueryHandler : IRequestHandler<GetMyProfileQuery, EmployeeDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyProfileQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeDto> Handle(GetMyProfileQuery request, CancellationToken cancellationToken)
    {
        var employeeId = _currentUserService.EmployeeId;
        if (employeeId == null)
        {
            throw new NotFoundException("Tài khoản của bạn chưa được liên kết với hồ sơ nhân viên nào.");
        }

        var employee = await _context.Employees
            .AsNoTracking()
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.Id == employeeId.Value, cancellationToken)
            ?? throw new NotFoundException("Hồ sơ nhân viên", employeeId.Value);

        return employee.ToDto();
    }
}
