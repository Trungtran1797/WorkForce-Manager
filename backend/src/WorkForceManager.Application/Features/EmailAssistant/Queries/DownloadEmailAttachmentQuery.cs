using MediatR;
using Microsoft.EntityFrameworkCore;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Application.Features.EmailAssistant.Queries;

public class DownloadEmailAttachmentQuery : IRequest<AttachmentResult?>
{
    public string MessageId { get; set; } = string.Empty;
    public string? PartSpecifier { get; set; }
    public string? AttachmentId { get; set; }
    public int? UserId { get; set; }
}

public class AttachmentResult
{
    public Stream Content { get; set; } = Stream.Null;
    public string ContentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}

public class DownloadEmailAttachmentQueryHandler : IRequestHandler<DownloadEmailAttachmentQuery, AttachmentResult?>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMailClientService _mailClientService;

    public DownloadEmailAttachmentQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IMailClientService mailClientService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _mailClientService = mailClientService;
    }

    public async Task<AttachmentResult?> Handle(DownloadEmailAttachmentQuery request, CancellationToken cancellationToken)
    {
        var userId = request.UserId ?? _currentUserService.UserId;
        
        UserEmailConfig? config = null;
        if (userId != null)
        {
            config = await _context.UserEmailConfigs
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);
        }
        
        if (config == null)
        {
            config = await _context.UserEmailConfigs
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (config == null) return null;

        try
        {
            var (content, contentType, fileName) = await _mailClientService.DownloadAttachmentAsync(
                config, 
                request.MessageId, 
                request.PartSpecifier, 
                request.AttachmentId, 
                cancellationToken);

            return new AttachmentResult
            {
                Content = content,
                ContentType = contentType,
                FileName = fileName
            };
        }
        catch
        {
            return null;
        }
    }
}
