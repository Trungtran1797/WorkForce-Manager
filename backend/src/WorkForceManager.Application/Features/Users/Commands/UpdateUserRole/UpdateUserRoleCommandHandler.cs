using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Users.Commands.UpdateUserRole;

public class UpdateUserRoleCommandHandler : IRequestHandler<UpdateUserRoleCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserRoleCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateUserRoleCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Tài khoản", request.Id);

        if (!Enum.TryParse<UserRole>(request.Role, out var role))
        {
            throw new ConflictException("Vai trò không hợp lệ.");
        }

        user.Role = role;

        await _context.SaveChangesAsync(cancellationToken);
    }
}
