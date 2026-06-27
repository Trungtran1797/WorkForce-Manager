using FluentValidation;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Employees.Commands.CreateEmployee;

public class CreateEmployeeCommandValidator : AbstractValidator<CreateEmployeeCommand>
{
    public CreateEmployeeCommandValidator()
    {
        RuleFor(x => x.EmployeeCode).NotEmpty().MaximumLength(30);
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.PhoneNumber).MaximumLength(20);
        RuleFor(x => x.IdCardNumber).MaximumLength(20);
        RuleFor(x => x.Position).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DepartmentId).GreaterThan(0).WithMessage("Vui lòng chọn phòng ban.");
        RuleFor(x => x.DateOfBirth).Must(BeValidDate).WithMessage("Ngày sinh không hợp lệ.");
        RuleFor(x => x.HireDate).Must(BeValidDate).WithMessage("Ngày vào làm không hợp lệ.");
        RuleFor(x => x.Gender).Must(g => Enum.TryParse<Gender>(g, out _)).WithMessage("Giới tính không hợp lệ.");
        RuleFor(x => x.Status).Must(s => Enum.TryParse<EmployeeStatus>(s, out _)).WithMessage("Trạng thái không hợp lệ.");
        RuleFor(x => x.PlaceOfOrigin).MaximumLength(200);
        RuleFor(x => x.MaritalStatus).MaximumLength(50);
        RuleFor(x => x.OneOfficeAccount).MaximumLength(150);
    }

    private static bool BeValidDate(string value) => DateTime.TryParse(value, out _);
}
