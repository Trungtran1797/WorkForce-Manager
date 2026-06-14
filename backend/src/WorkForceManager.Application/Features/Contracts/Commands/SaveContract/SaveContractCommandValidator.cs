using FluentValidation;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Contracts.Commands.SaveContract;

public class SaveContractCommandValidator : AbstractValidator<SaveContractCommand>
{
    public SaveContractCommandValidator()
    {
        RuleFor(x => x.EmployeeId).GreaterThan(0).WithMessage("Vui lòng chọn nhân viên.");
        RuleFor(x => x.ContractCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ContractType).Must(t => Enum.TryParse<ContractType>(t, out _)).WithMessage("Loại hợp đồng không hợp lệ.");
        RuleFor(x => x.Status).Must(s => Enum.TryParse<ContractStatus>(s, out _)).WithMessage("Trạng thái không hợp lệ.");
        RuleFor(x => x.StartDate).Must(d => DateTime.TryParse(d, out _)).WithMessage("Ngày bắt đầu không hợp lệ.");
        RuleFor(x => x.BaseSalary).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Allowance).GreaterThanOrEqualTo(0);
        RuleFor(x => x.InsuranceSalary).GreaterThanOrEqualTo(0);
    }
}
