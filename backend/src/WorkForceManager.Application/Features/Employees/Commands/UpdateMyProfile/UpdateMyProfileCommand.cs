using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Employees.Common;

namespace WorkForceManager.Application.Features.Employees.Commands.UpdateMyProfile;

public record UpdateMyProfileCommand(
    string PhoneNumber,
    string Email,
    string? Address,
    string? PlaceOfOrigin,
    string? MaritalStatus
) : IRequest<EmployeeDto>;

public class UpdateMyProfileCommandHandler : IRequestHandler<UpdateMyProfileCommand, EmployeeDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateMyProfileCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<EmployeeDto> Handle(UpdateMyProfileCommand request, CancellationToken cancellationToken)
    {
        var employeeId = _currentUserService.EmployeeId;
        if (employeeId == null)
        {
            throw new NotFoundException("Tài khoản của bạn chưa được liên kết với hồ sơ nhân viên nào.");
        }

        var employee = await _context.Employees
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.Id == employeeId.Value, cancellationToken)
            ?? throw new NotFoundException("Hồ sơ nhân viên", employeeId.Value);

        // Cập nhật thông tin nhân sự
        employee.PhoneNumber = request.PhoneNumber;
        employee.Email = request.Email;
        employee.Address = request.Address;
        employee.PlaceOfOrigin = request.PlaceOfOrigin;
        employee.MaritalStatus = request.MaritalStatus;

        _context.Employees.Update(employee);

        // Đồng bộ hóa với thực thể User (nếu đổi email)
        var userId = _currentUserService.UserId;
        if (userId != null)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken);
            if (user != null)
            {
                user.Email = request.Email;
                _context.Users.Update(user);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return employee.ToDto();
    }
}
