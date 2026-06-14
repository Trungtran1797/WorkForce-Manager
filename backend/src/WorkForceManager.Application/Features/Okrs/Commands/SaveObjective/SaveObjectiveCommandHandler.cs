using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Okrs.Common;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Okrs.Commands.SaveObjective;

public class SaveObjectiveCommandHandler : IRequestHandler<SaveObjectiveCommand, OkrObjectiveDto>
{
    private readonly IApplicationDbContext _context;

    public SaveObjectiveCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OkrObjectiveDto> Handle(SaveObjectiveCommand request, CancellationToken cancellationToken)
    {
        var ownerType = Enum.Parse<OkrOwnerType>(request.OwnerType);

        if (ownerType == OkrOwnerType.Department)
        {
            _ = await _context.Departments.FirstOrDefaultAsync(d => d.Id == request.DepartmentId, cancellationToken)
                ?? throw new NotFoundException("Phòng ban", request.DepartmentId!.Value);
        }
        else
        {
            _ = await _context.Employees.FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken)
                ?? throw new NotFoundException("Nhân viên", request.EmployeeId!.Value);
        }

        OkrObjective objective;
        if (request.Id > 0)
        {
            objective = await _context.OkrObjectives
                .Include(o => o.KeyResults)
                .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken)
                ?? throw new NotFoundException("Mục tiêu OKR", request.Id);
        }
        else
        {
            objective = new OkrObjective();
            _context.OkrObjectives.Add(objective);
        }

        objective.Title = request.Title.Trim();
        objective.Description = request.Description;
        objective.OwnerType = ownerType;
        objective.DepartmentId = ownerType == OkrOwnerType.Department ? request.DepartmentId : null;
        objective.EmployeeId = ownerType == OkrOwnerType.Individual ? request.EmployeeId : null;
        objective.Period = request.Period.Trim();
        objective.Status = Enum.Parse<OkrStatus>(request.Status);

        var requestedIds = request.KeyResults.Where(k => k.Id > 0).Select(k => k.Id).ToHashSet();
        var toRemove = objective.KeyResults.Where(k => !requestedIds.Contains(k.Id)).ToList();
        foreach (var kr in toRemove)
        {
            objective.KeyResults.Remove(kr);
            _context.KeyResults.Remove(kr);
        }

        foreach (var input in request.KeyResults)
        {
            if (input.Id > 0)
            {
                var existing = objective.KeyResults.First(k => k.Id == input.Id);
                existing.Title = input.Title.Trim();
                existing.TargetValue = input.TargetValue;
                existing.CurrentValue = input.CurrentValue;
                existing.Unit = input.Unit;
                existing.Weight = input.Weight;
            }
            else
            {
                objective.KeyResults.Add(new KeyResult
                {
                    Title = input.Title.Trim(),
                    TargetValue = input.TargetValue,
                    CurrentValue = input.CurrentValue,
                    Unit = input.Unit,
                    Weight = input.Weight
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        var saved = await _context.OkrObjectives
            .AsNoTracking()
            .Include(o => o.Department)
            .Include(o => o.Employee)
            .Include(o => o.KeyResults)
            .FirstAsync(o => o.Id == objective.Id, cancellationToken);

        return saved.ToDto();
    }
}
