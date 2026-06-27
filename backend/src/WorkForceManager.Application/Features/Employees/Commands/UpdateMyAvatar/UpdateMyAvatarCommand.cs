using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Employees.Common;

namespace WorkForceManager.Application.Features.Employees.Commands.UpdateMyAvatar;

public record UpdateMyAvatarCommand(string? AvatarUrl) : IRequest<EmployeeDto>;

public class UpdateMyAvatarCommandHandler : IRequestHandler<UpdateMyAvatarCommand, EmployeeDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateMyAvatarCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeDto> Handle(UpdateMyAvatarCommand request, CancellationToken cancellationToken)
    {
        var employeeId = _currentUserService.EmployeeId
            ?? throw new NotFoundException("Tài khoản chưa liên kết hồ sơ nhân viên.");

        var employee = await _context.Employees
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.Id == employeeId, cancellationToken)
            ?? throw new NotFoundException("Hồ sơ nhân viên", employeeId);

        employee.AvatarUrl = request.AvatarUrl;
        _context.Employees.Update(employee);
        await _context.SaveChangesAsync(cancellationToken);

        return employee.ToDto();
    }
}
