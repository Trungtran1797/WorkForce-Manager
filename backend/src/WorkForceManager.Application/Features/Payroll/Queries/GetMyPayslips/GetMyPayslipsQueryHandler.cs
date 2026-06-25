using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Payroll.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Payroll.Queries.GetMyPayslips;

public class GetMyPayslipsQueryHandler : IRequestHandler<GetMyPayslipsQuery, List<PayslipDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetMyPayslipsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<PayslipDto>> Handle(GetMyPayslipsQuery request, CancellationToken cancellationToken)
    {
        var employeeId = _currentUserService.EmployeeId;
        if (employeeId is null or 0)
            return [];

        // Nhân viên chỉ thấy phiếu đã duyệt/đã trả, không thấy bản nháp.
        var payslips = await _context.Payslips
            .AsNoTracking()
            .Include(p => p.Items)
            .Include(p => p.Employee)
            .Where(p => p.EmployeeId == employeeId && p.Status != PayslipStatus.Draft)
            .OrderByDescending(p => p.Period)
            .ToListAsync(cancellationToken);

        return payslips.Select(p => p.ToDto()).ToList();
    }
}
