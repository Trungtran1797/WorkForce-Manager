using MediatR;
using Microsoft.AspNetCore.Http;
using WorkForceManager.Application.Common.Models;

namespace WorkForceManager.Application.Features.Projects.Commands.UploadProjectAttachments;

public record UploadProjectAttachmentsCommand(int ProjectId, List<IFormFile>? Files) : IRequest<ApiResponse<object>>;
