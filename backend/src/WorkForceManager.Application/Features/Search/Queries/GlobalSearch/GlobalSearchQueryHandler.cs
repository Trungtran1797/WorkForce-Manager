using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Search.Common;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Application.Features.Search.Queries.GlobalSearch;

public class GlobalSearchQueryHandler : IRequestHandler<GlobalSearchQuery, GlobalSearchResultDto>
{
    private const int ResultLimit = 5;

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GlobalSearchQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<GlobalSearchResultDto> Handle(GlobalSearchQuery request, CancellationToken cancellationToken)
    {
        var term = request.Keyword.Trim().ToLower();
        if (term.Length < 2)
        {
            return new GlobalSearchResultDto();
        }

        var scopeDeptIds = await GetDepartmentScopeAsync(cancellationToken);

        return new GlobalSearchResultDto
        {
            Employees = await SearchEmployeesAsync(term, scopeDeptIds, cancellationToken),
            Departments = await SearchDepartmentsAsync(term, scopeDeptIds, cancellationToken),
            Projects = await SearchProjectsAsync(term, scopeDeptIds, cancellationToken),
            Tasks = await SearchTasksAsync(term, scopeDeptIds, cancellationToken),
        };
    }

    /// <summary>
    /// SuperAdmin (hoặc user chưa gắn phòng ban) thấy toàn bộ dữ liệu (null = không giới hạn).
    /// Manager/Employee chỉ thấy dữ liệu thuộc phòng ban của mình và các phòng con (cấu trúc 2 cấp).
    /// </summary>
    private async Task<List<int>?> GetDepartmentScopeAsync(CancellationToken cancellationToken)
    {
        if (_currentUser.Role == UserRole.SuperAdmin || _currentUser.DepartmentId is not { } departmentId)
        {
            return null;
        }

        return await _context.Departments
            .AsNoTracking()
            .Where(d => d.Id == departmentId || d.ParentDepartmentId == departmentId)
            .Select(d => d.Id)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<SearchResultItemDto>> SearchEmployeesAsync(
        string term, List<int>? scopeDeptIds, CancellationToken cancellationToken)
    {
        var query = _context.Employees.AsNoTracking()
            .Where(e => e.FullName.ToLower().Contains(term) || 
                        e.EmployeeCode.ToLower().Contains(term) || 
                        e.Email.ToLower().Contains(term) ||
                        e.PhoneNumber.ToLower().Contains(term) ||
                        e.Position.ToLower().Contains(term) ||
                        e.Department.Name.ToLower().Contains(term));

        if (scopeDeptIds is not null)
        {
            query = query.Where(e => scopeDeptIds.Contains(e.DepartmentId));
        }

        return await query
            .Take(ResultLimit)
            .Select(e => new SearchResultItemDto
            {
                Id = e.Id,
                Title = e.FullName,
                Code = e.EmployeeCode,
                Subtitle = e.Email,
            })
            .ToListAsync(cancellationToken);
    }

    private async Task<List<SearchResultItemDto>> SearchDepartmentsAsync(
        string term, List<int>? scopeDeptIds, CancellationToken cancellationToken)
    {
        var query = _context.Departments.AsNoTracking()
            .Where(d => d.Name.ToLower().Contains(term) || 
                        (d.Description != null && d.Description.ToLower().Contains(term)) ||
                        (d.Manager != null && d.Manager.FullName.ToLower().Contains(term)));

        if (scopeDeptIds is not null)
        {
            query = query.Where(d => scopeDeptIds.Contains(d.Id));
        }

        return await query
            .Take(ResultLimit)
            .Select(d => new SearchResultItemDto
            {
                Id = d.Id,
                Title = d.Name,
                Subtitle = d.Description,
            })
            .ToListAsync(cancellationToken);
    }

    private async Task<List<SearchResultItemDto>> SearchProjectsAsync(
        string term, List<int>? scopeDeptIds, CancellationToken cancellationToken)
    {
        var query = _context.Projects.AsNoTracking()
            .Where(p => p.Code.ToLower().Contains(term) || 
                        p.Name.ToLower().Contains(term) || 
                        (p.Investor != null && p.Investor.ToLower().Contains(term)) ||
                        (p.Description != null && p.Description.ToLower().Contains(term)) ||
                        p.Attachments.Any(a => a.FileName.ToLower().Contains(term)));

        var employeeId = _currentUser.EmployeeId;
        if (scopeDeptIds is not null && employeeId is not null)
        {
            query = query.Where(p => 
                p.Members.Any(m => m.EmployeeId == employeeId.Value) || 
                p.Members.Any(m => scopeDeptIds.Contains(m.Employee!.DepartmentId)));
        }
        else if (scopeDeptIds is not null)
        {
            query = query.Where(p => p.Members.Any(m => scopeDeptIds.Contains(m.Employee!.DepartmentId)));
        }

        return await query
            .Take(ResultLimit)
            .Select(p => new SearchResultItemDto
            {
                Id = p.Id,
                Title = p.Name,
                Code = p.Code,
                Subtitle = p.Investor,
            })
            .ToListAsync(cancellationToken);
    }

    private async Task<List<SearchResultItemDto>> SearchTasksAsync(
        string term, List<int>? scopeDeptIds, CancellationToken cancellationToken)
    {
        var query = _context.Tasks.AsNoTracking()
            .Where(t => t.Code.ToLower().Contains(term) || 
                        t.Title.ToLower().Contains(term) ||
                        (t.Description != null && t.Description.ToLower().Contains(term)) ||
                        t.Attachments.Any(a => a.FileName.ToLower().Contains(term)));

        var employeeId = _currentUser.EmployeeId;
        if (scopeDeptIds is not null && employeeId is not null)
        {
            query = query.Where(t =>
                t.AssigneeId == employeeId.Value ||
                t.AssignerId == employeeId.Value ||
                t.Assignees.Any(ta => ta.EmployeeId == employeeId.Value) ||
                (t.Project != null && t.Project.Members.Any(m => m.EmployeeId == employeeId.Value)) ||
                (t.Assignee != null && scopeDeptIds.Contains(t.Assignee.DepartmentId)) ||
                (t.Assigner != null && scopeDeptIds.Contains(t.Assigner.DepartmentId)) ||
                (t.Project != null && t.Project.Members.Any(m => scopeDeptIds.Contains(m.Employee!.DepartmentId))));
        }
        else if (scopeDeptIds is not null)
        {
            query = query.Where(t =>
                (t.Assignee != null && scopeDeptIds.Contains(t.Assignee.DepartmentId)) ||
                (t.Assigner != null && scopeDeptIds.Contains(t.Assigner.DepartmentId)) ||
                (t.Project != null && t.Project.Members.Any(m => scopeDeptIds.Contains(m.Employee!.DepartmentId))));
        }

        return await query
            .Take(ResultLimit)
            .Select(t => new SearchResultItemDto
            {
                Id = t.Id,
                Title = t.Title,
                Code = t.Code,
                Subtitle = t.Status.ToString(),
            })
            .ToListAsync(cancellationToken);
    }
}
