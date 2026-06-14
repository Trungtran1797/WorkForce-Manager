using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Shifts.Common;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.Shifts.Commands.AssignShift;

public class AssignShiftCommandHandler : IRequestHandler<AssignShiftCommand, ShiftAssignmentDto>
{
    private readonly IApplicationDbContext _context;

    public AssignShiftCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ShiftAssignmentDto> Handle(AssignShiftCommand request, CancellationToken cancellationToken)
    {
        var workDate = DateTime.Parse(request.WorkDate).Date;

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken)
            ?? throw new NotFoundException("Nhân viên", request.EmployeeId);

        var shift = await _context.Shifts
            .FirstOrDefaultAsync(s => s.Id == request.ShiftId, cancellationToken)
            ?? throw new NotFoundException("Ca làm việc", request.ShiftId);

        var existing = await _context.ShiftAssignments
            .FirstOrDefaultAsync(a => a.EmployeeId == request.EmployeeId && a.WorkDate == workDate, cancellationToken);

        ShiftAssignment assignment;
        if (existing != null)
        {
            // Một nhân viên chỉ có một ca mỗi ngày → cập nhật ca thay vì tạo trùng.
            existing.ShiftId = request.ShiftId;
            existing.Note = request.Note;
            assignment = existing;
        }
        else
        {
            assignment = new ShiftAssignment
            {
                EmployeeId = request.EmployeeId,
                ShiftId = request.ShiftId,
                WorkDate = workDate,
                Note = request.Note
            };
            _context.ShiftAssignments.Add(assignment);
        }

        await _context.SaveChangesAsync(cancellationToken);

        assignment.Employee = employee;
        assignment.Shift = shift;
        return assignment.ToDto();
    }
}
