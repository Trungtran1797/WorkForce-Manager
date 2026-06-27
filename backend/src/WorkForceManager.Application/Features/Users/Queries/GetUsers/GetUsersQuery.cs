using MediatR;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Users.Common;

namespace WorkForceManager.Application.Features.Users.Queries.GetUsers;

public class GetUsersQuery : PaginationRequest, IRequest<PaginatedList<UserDto>>
{
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}
