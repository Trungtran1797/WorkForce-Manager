using System.Diagnostics;
using MediatR;
using Microsoft.Extensions.Logging;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Application.Common.Behaviours;

/// <summary>Log mọi request kèm UserId, thời gian xử lý và cảnh báo request chậm.</summary>
public class LoggingBehaviour<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehaviour<TRequest, TResponse>> _logger;
    private readonly ICurrentUserService _currentUser;

    public LoggingBehaviour(
        ILogger<LoggingBehaviour<TRequest, TResponse>> logger, ICurrentUserService currentUser)
    {
        _logger = logger;
        _currentUser = currentUser;
    }

    public async Task<TResponse> Handle(
        TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var stopwatch = Stopwatch.StartNew();

        _logger.LogInformation(
            "Handling {RequestName} | UserId: {UserId}", requestName, _currentUser.UserId);

        var response = await next();
        stopwatch.Stop();

        var elapsed = stopwatch.ElapsedMilliseconds;
        if (elapsed > 500)
        {
            _logger.LogWarning(
                "Long running request {RequestName} took {Elapsed}ms | UserId: {UserId}",
                requestName, elapsed, _currentUser.UserId);
        }
        else
        {
            _logger.LogInformation("Handled {RequestName} in {Elapsed}ms", requestName, elapsed);
        }

        return response;
    }
}
