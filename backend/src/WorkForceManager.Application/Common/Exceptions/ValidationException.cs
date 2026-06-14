using FluentValidation.Results;

namespace WorkForceManager.Application.Common.Exceptions;

public class ValidationException : Exception
{
    public ValidationException() : base("Một hoặc nhiều lỗi kiểm tra dữ liệu đã xảy ra.")
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(IEnumerable<ValidationFailure> failures) : this()
    {
        Errors = failures
            .GroupBy(e => e.PropertyName, e => e.ErrorMessage)
            .ToDictionary(g => g.Key, g => g.ToArray());
    }

    public IDictionary<string, string[]> Errors { get; }
}
