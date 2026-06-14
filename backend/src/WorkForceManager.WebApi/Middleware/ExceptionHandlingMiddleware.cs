using System.Net;
using System.Text.Json;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Models;
using ValidationException = WorkForceManager.Application.Common.Exceptions.ValidationException;

namespace WorkForceManager.WebApi.Middleware;

/// <summary>
/// Bắt mọi exception ở boundary và map sang ApiResponse + HTTP status code chuẩn (api-rules.md).
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message, errors) = exception switch
        {
            ValidationException ve => (HttpStatusCode.BadRequest, "Dữ liệu không hợp lệ.", ve.Errors),
            NotFoundException => (HttpStatusCode.NotFound, exception.Message, null),
            ForbiddenAccessException => (HttpStatusCode.Forbidden, exception.Message, null),
            ConflictException => (HttpStatusCode.Conflict, exception.Message, null),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized,
                string.IsNullOrWhiteSpace(exception.Message) ? "Chưa xác thực." : exception.Message, null),
            _ => (HttpStatusCode.InternalServerError, "Đã xảy ra lỗi không mong muốn.", (IDictionary<string, string[]>?)null)
        };

        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(exception, "Unhandled exception at {Path}", context.Request.Path);
        }
        else
        {
            _logger.LogWarning("Handled {ExceptionType} at {Path}: {Message}",
                exception.GetType().Name, context.Request.Path, exception.Message);
        }

        var response = ApiResponse<object>.Fail(message, errors);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}
