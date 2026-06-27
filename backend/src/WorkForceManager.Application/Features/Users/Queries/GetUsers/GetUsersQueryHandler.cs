using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Users.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Users.Queries.GetUsers;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, PaginatedList<UserDto>>
{
    private readonly IApplicationDbContext _context;

    public GetUsersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<UserDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Users
            .AsNoTracking()
            .Include(u => u.Employee)
                .ThenInclude(e => e!.Department)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(u =>
                u.Username.Contains(term) ||
                u.Email.Contains(term) ||
                (u.Employee != null && u.Employee.FullName.Contains(term)) ||
                (u.Employee != null && u.Employee.EmployeeCode.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(request.Role)
            && Enum.TryParse<UserRole>(request.Role, out var role))
        {
            query = query.Where(u => u.Role == role);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(u => u.IsActive == request.IsActive.Value);
        }

        query = (request.SortBy?.ToLowerInvariant()) switch
        {
            "username" => request.IsDescending ? query.OrderByDescending(u => u.Username) : query.OrderBy(u => u.Username),
            "email" => request.IsDescending ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
            "role" => request.IsDescending ? query.OrderByDescending(u => u.Role) : query.OrderBy(u => u.Role),
            "isactive" => request.IsDescending ? query.OrderByDescending(u => u.IsActive) : query.OrderBy(u => u.IsActive),
            _ => request.IsDescending ? query.OrderByDescending(u => u.CreatedDate) : query.OrderBy(u => u.CreatedDate),
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var users = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var items = users.Select(u => new UserDto(
            u.Id,
            u.Username,
            u.Email,
            u.Role.ToString(),
            u.IsActive,
            u.EmployeeId,
            u.Employee?.FullName,
            u.Employee?.EmployeeCode,
            u.Employee?.Department?.Name
        )).ToList();

        return new PaginatedList<UserDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
