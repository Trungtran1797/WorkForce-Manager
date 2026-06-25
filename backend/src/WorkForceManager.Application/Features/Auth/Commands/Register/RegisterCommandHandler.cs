using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Auth.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Auth.Commands.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthUserDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IPermissionService _permissionService;

    public RegisterCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher, IPermissionService permissionService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _permissionService = permissionService;
    }

    public async Task<AuthUserDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var username = request.Username.Trim();
        var email = request.Email.Trim();

        if (await _context.Users.AnyAsync(u => u.Username == username, cancellationToken))
        {
            throw new ConflictException("Tên đăng nhập đã tồn tại.");
        }

        if (await _context.Users.AnyAsync(u => u.Email == email, cancellationToken))
        {
            throw new ConflictException("Email đã tồn tại.");
        }

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = Enum.Parse<UserRole>(request.Role),
            EmployeeId = request.EmployeeId,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        int? departmentId = null;
        if (user.EmployeeId.HasValue)
        {
            departmentId = await _context.Employees
                .AsNoTracking()
                .Where(e => e.Id == user.EmployeeId.Value)
                .Select(e => (int?)e.DepartmentId)
                .FirstOrDefaultAsync(cancellationToken);
        }

        var permissions = await _permissionService.GetEffectivePermissionsAsync(
            user.Role, departmentId, cancellationToken);
        var permissionsDto = permissions.ToDictionary(kv => kv.Key.ToString(), kv => kv.Value.ToString());

        return user.ToAuthUserDto(permissionsDto);
    }
}
