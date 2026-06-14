using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Shifts.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Shifts.Commands.CreateShift;

public class CreateShiftCommandHandler : IRequestHandler<CreateShiftCommand, ShiftDto>
{
    private readonly IApplicationDbContext _context;

    public CreateShiftCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ShiftDto> Handle(CreateShiftCommand request, CancellationToken cancellationToken)
    {
        var code = request.Code.Trim();
        if (await _context.Shifts.AnyAsync(s => s.Code == code, cancellationToken))
        {
            throw new ConflictException($"Mã ca '{code}' đã tồn tại.");
        }

        var shift = new Shift
        {
            Code = code,
            Name = request.Name.Trim(),
            StartTime = TimeOnly.Parse(request.StartTime),
            EndTime = TimeOnly.Parse(request.EndTime),
            BreakMinutes = request.BreakMinutes,
            ShiftType = Enum.Parse<ShiftType>(request.ShiftType),
            IsActive = request.IsActive
        };

        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync(cancellationToken);

        return shift.ToDto();
    }
}
