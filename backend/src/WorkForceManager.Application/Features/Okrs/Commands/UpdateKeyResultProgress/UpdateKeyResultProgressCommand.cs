using MediatR;
using WorkForceManager.Application.Features.Okrs.Common;

namespace WorkForceManager.Application.Features.Okrs.Commands.UpdateKeyResultProgress;

/// <summary>Cập nhật giá trị hiện tại (CurrentValue) của một Key Result.</summary>
public record UpdateKeyResultProgressCommand(int KeyResultId, decimal CurrentValue) : IRequest<OkrObjectiveDto>;
