namespace WorkForceManager.Application.Common.Models;

/// <summary>Response envelope chuẩn cho mọi endpoint (xem api-rules.md).</summary>
public class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }
    public IDictionary<string, string[]>? Errors { get; init; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string message, IDictionary<string, string[]>? errors = null) =>
        new() { Success = false, Message = message, Errors = errors };
}

/// <summary>Helper cho response không có payload.</summary>
public static class ApiResponse
{
    public static ApiResponse<T> Ok<T>(T data, string? message = null) => ApiResponse<T>.Ok(data, message);
    public static ApiResponse<object> Ok(string? message = null) =>
        new() { Success = true, Data = null, Message = message };
}
