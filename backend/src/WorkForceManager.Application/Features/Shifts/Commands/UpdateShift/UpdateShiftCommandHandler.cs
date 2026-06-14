using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Shifts.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Shifts.Commands.UpdateShift;

public class UpdateShiftCommandHandler : IRequestHandler<UpdateShiftCommand, ShiftDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateShiftCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ShiftDto> Handle(UpdateShiftCommand request, CancellationToken cancellationToken)
    {
        var shift = await _context.Shifts
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException("Ca làm việc", request.Id);

        var code = request.Code.Trim();
        if (await _context.Shifts.AnyAsync(s => s.Code == code && s.Id != request.Id, cancellationToken))
        {
            throw new ConflictException($"Mã ca '{code}' đã tồn tại.");
        }

        shift.Code = code;
        shift.Name = request.Name.Trim();
        shift.StartTime = TimeOnly.Parse(request.StartTime);
        shift.EndTime = TimeOnly.Parse(request.EndTime);
        shift.BreakMinutes = request.BreakMinutes;
        shift.ShiftType = Enum.Parse<ShiftType>(request.ShiftType);
        shift.IsActive = request.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        return shift.ToDto();
    }
}
