using MediatR;
using WorkForceManager.Application.Features.Tasks.Common;

namespace WorkForceManager.Application.Features.Tasks.Commands.UpdateTaskStatus;

/// <summary>PATCH đổi trạng thái (kéo-thả Kanban); progress tùy chọn.</summary>
public record UpdateTaskStatusCommand(int Id, string Status, int? Progress) : IRequest<TaskDto>;
