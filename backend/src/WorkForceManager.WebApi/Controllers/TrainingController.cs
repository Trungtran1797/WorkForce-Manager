using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Training.Commands.CompleteTraining;
using WorkForceManager.Application.Features.Training.Commands.EnrollTraining;
using WorkForceManager.Application.Features.Training.Commands.SaveCourse;
using WorkForceManager.Application.Features.Training.Common;
using WorkForceManager.Application.Features.Training.Queries.GetCourses;
using WorkForceManager.Infrastructure.Identity;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/training-courses")]
public class TrainingController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetCoursesQuery(), ct);
        return Ok(ApiResponse<List<TrainingCourseDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.CanManagePerformance)]
    public async Task<IActionResult> Save([FromBody] SaveCourseCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<TrainingCourseDto>.Ok(result, "Lưu khóa đào tạo thành công."));
    }

    [HttpPost("{courseId:int}/enroll")]
    public async Task<IActionResult> Enroll(int courseId, [FromBody] EnrollTrainingRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(new EnrollTrainingCommand(courseId, request.EmployeeId), ct);
        return Ok(ApiResponse<TrainingEnrollmentDto>.Ok(result, "Đăng ký khóa đào tạo thành công."));
    }

    [HttpPatch("enrollments/{enrollmentId:int}")]
    [Authorize(Policy = AuthorizationPolicies.CanManagePerformance)]
    public async Task<IActionResult> CompleteEnrollment(int enrollmentId, [FromBody] CompleteTrainingRequest request, CancellationToken ct)
    {
        var result = await Mediator.Send(new CompleteTrainingCommand(enrollmentId, request.Status, request.CertificateCode), ct);
        return Ok(ApiResponse<TrainingEnrollmentDto>.Ok(result, "Cập nhật trạng thái đào tạo thành công."));
    }
}

public record EnrollTrainingRequest(int EmployeeId);
public record CompleteTrainingRequest(string Status, string? CertificateCode);
