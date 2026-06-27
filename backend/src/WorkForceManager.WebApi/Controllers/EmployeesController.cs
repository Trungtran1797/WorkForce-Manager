using System.IO;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Application.Features.Employees.Commands.CreateEmployee;
using WorkForceManager.Application.Features.Employees.Commands.DeleteEmployee;
using WorkForceManager.Application.Features.Employees.Commands.UpdateEmployee;
using WorkForceManager.Application.Features.Employees.Commands.ImportEmployees;
using WorkForceManager.Application.Features.Employees.Commands.UpdateMyAvatar;
using WorkForceManager.Application.Features.Employees.Commands.UpdateMyCoverPhoto;
using WorkForceManager.Application.Features.Employees.Commands.UpdateMyProfile;
using WorkForceManager.Application.Features.Employees.Common;
using WorkForceManager.Application.Features.Employees.Queries.GetEmployeeById;
using WorkForceManager.Application.Features.Employees.Queries.GetEmployees;
using WorkForceManager.Application.Features.Employees.Queries.ExportEmployees;
using WorkForceManager.Application.Features.Employees.Queries.GetMyProfile;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Identity.Authorization;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/employees")]
public class EmployeesController : ApiControllerBase
{
    private static readonly HashSet<string> _allowedImageTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp"
    };
    private const long MaxImageBytes = 5 * 1024 * 1024; // 5 MB
    [HttpGet]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetAll([FromQuery] GetEmployeesQuery query, CancellationToken ct)
    {
        var result = await Mediator.Send(query, ct);
        return Ok(ApiResponse<PaginatedList<EmployeeDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetEmployeeByIdQuery(id), ct);
        return Ok(ApiResponse<EmployeeDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<EmployeeDto>.Ok(result, "Thêm nhân viên thành công."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeCommand command, CancellationToken ct)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<object>.Fail("Id không khớp."));
        }
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<EmployeeDto>.Ok(result, "Cập nhật nhân viên thành công."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await Mediator.Send(new DeleteEmployeeCommand(id), ct);
        return Ok(ApiResponse.Ok("Đã xóa nhân viên."));
    }

    [HttpGet("export")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.View))]
    public async Task<IActionResult> Export([FromQuery] bool templateOnly, CancellationToken ct)
    {
        var result = await Mediator.Send(new ExportEmployeesQuery(templateOnly), ct);
        return File(result.FileContents, result.ContentType, result.FileName);
    }

    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    [Authorize(Policy = "Permission:" + nameof(PermissionModule.Employees) + ":" + nameof(PermissionLevel.Edit))]
    public async Task<IActionResult> Import([FromForm] IFormFile file, CancellationToken ct)
    {
        var result = await Mediator.Send(new ImportEmployeesCommand(file), ct);
        return Ok(ApiResponse<ImportEmployeesResultDto>.Ok(result, "Xử lý import thành công."));
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMyProfileQuery(), ct);
        return Ok(ApiResponse<EmployeeDto>.Ok(result));
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateMyProfileCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return Ok(ApiResponse<EmployeeDto>.Ok(result, "Cập nhật hồ sơ cá nhân thành công."));
    }

    [HttpPost("profile/avatar")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar(
        [FromForm] IFormFile file,
        [FromServices] IWebHostEnvironment env,
        [FromServices] IApplicationDbContext dbContext,
        [FromServices] ICurrentUserService currentUser,
        CancellationToken ct)
    {
        var validation = ValidateImageFile(file);
        if (validation != null) return BadRequest(ApiResponse<object>.Fail(validation));

        var uploadDir = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads", "avatars");
        if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

        var storedName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
        var storedPath = Path.Combine(uploadDir, storedName);
        await using (var stream = new FileStream(storedPath, FileMode.Create))
            await file.CopyToAsync(stream, ct);

        var relativeUrl = $"/uploads/avatars/{storedName}";

        // Xóa avatar cũ nếu có
        var emp = await dbContext.Employees.FirstOrDefaultAsync(e => e.Id == currentUser.EmployeeId, ct);
        if (emp?.AvatarUrl != null)
            DeleteOldFile(env, emp.AvatarUrl);

        var result = await Mediator.Send(new UpdateMyAvatarCommand(relativeUrl), ct);

        // Auto-post to wall
        await CreateWallPostAsync(env, dbContext, currentUser, result,
            "đã cập nhật ảnh đại diện",
            file, storedName, ct);

        return Ok(ApiResponse<EmployeeDto>.Ok(result, "Cập nhật ảnh đại diện thành công."));
    }

    [HttpPost("profile/cover")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadCoverPhoto(
        [FromForm] IFormFile file,
        [FromServices] IWebHostEnvironment env,
        [FromServices] IApplicationDbContext dbContext,
        [FromServices] ICurrentUserService currentUser,
        CancellationToken ct)
    {
        var validation = ValidateImageFile(file);
        if (validation != null) return BadRequest(ApiResponse<object>.Fail(validation));

        var uploadDir = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads", "covers");
        if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

        var storedName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
        var storedPath = Path.Combine(uploadDir, storedName);
        await using (var stream = new FileStream(storedPath, FileMode.Create))
            await file.CopyToAsync(stream, ct);

        var relativeUrl = $"/uploads/covers/{storedName}";

        var emp = await dbContext.Employees.FirstOrDefaultAsync(e => e.Id == currentUser.EmployeeId, ct);
        if (emp?.CoverPhotoUrl != null)
            DeleteOldFile(env, emp.CoverPhotoUrl);

        var result = await Mediator.Send(new UpdateMyCoverPhotoCommand(relativeUrl), ct);

        await CreateWallPostAsync(env, dbContext, currentUser, result,
            "đã cập nhật ảnh bìa",
            file, storedName, ct);

        return Ok(ApiResponse<EmployeeDto>.Ok(result, "Cập nhật ảnh bìa thành công."));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static string? ValidateImageFile(IFormFile file)
    {
        if (file == null || file.Length == 0) return "Vui lòng chọn file ảnh.";
        if (!_allowedImageTypes.Contains(file.ContentType)) return "Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP).";
        if (file.Length > MaxImageBytes) return "Kích thước ảnh tối đa là 5 MB.";
        return null;
    }

    private static void DeleteOldFile(IWebHostEnvironment env, string relativeUrl)
    {
        try
        {
            var wwwroot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            var fullPath = Path.Combine(wwwroot, relativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
        }
        catch { /* best-effort */ }
    }

    private static async Task CreateWallPostAsync(
        IWebHostEnvironment env,
        IApplicationDbContext dbContext,
        ICurrentUserService currentUser,
        EmployeeDto emp,
        string action,
        IFormFile file,
        string originalStoredName,
        CancellationToken ct)
    {
        try
        {
            var wallDir = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads", "wall");
            if (!Directory.Exists(wallDir)) Directory.CreateDirectory(wallDir);

            // Copy ảnh vào thư mục wall để hiển thị inline trong post
            var wallStoredName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
            var srcPath = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads",
                action.Contains("bìa") ? "covers" : "avatars", originalStoredName);
            var dstPath = Path.Combine(wallDir, wallStoredName);
            if (System.IO.File.Exists(srcPath)) System.IO.File.Copy(srcPath, dstPath, overwrite: true);

            var dbPath = Path.Combine(env.ContentRootPath, "App_Data", "wall_posts.json");
            var posts = System.IO.File.Exists(dbPath)
                ? JsonSerializer.Deserialize<List<WallPostMinimal>>(await System.IO.File.ReadAllTextAsync(dbPath, ct)) ?? new()
                : new List<WallPostMinimal>();

            var newId = posts.Count > 0 ? posts.Max(p => p.Id) + 1 : 1;
            var post = new WallPostMinimal
            {
                Id = newId,
                AuthorId = currentUser.EmployeeId ?? 0,
                AuthorName = emp.FullName,
                AuthorPosition = emp.Position,
                AuthorDepartment = emp.DepartmentName,
                AuthorAvatarUrl = emp.AvatarUrl,
                Title = null,
                Content = $"{emp.FullName} {action}.",
                CreatedDate = DateTime.Now,
                IsApproved = true,
                IsCompanyPost = false,
                Attachments = System.IO.File.Exists(dstPath)
                    ? new List<WallAttachmentMinimal>
                    {
                        new() { FileName = file.FileName, StoredPath = wallStoredName, FileSizeBytes = file.Length, ContentType = file.ContentType }
                    }
                    : new()
            };

            posts.Add(post);
            await System.IO.File.WriteAllTextAsync(dbPath,
                JsonSerializer.Serialize(posts, new JsonSerializerOptions { WriteIndented = true }), ct);
        }
        catch { /* wall post is best-effort, không fail upload */ }
    }

    // Minimal models chỉ dùng để ghi JSON wall post (tránh circular dependency)
    private sealed class WallPostMinimal
    {
        public int Id { get; set; }
        public int AuthorId { get; set; }
        public string AuthorName { get; set; } = "";
        public string? AuthorPosition { get; set; }
        public string? AuthorDepartment { get; set; }
        public string? AuthorAvatarUrl { get; set; }
        public string? Title { get; set; }
        public string Content { get; set; } = "";
        public DateTime CreatedDate { get; set; }
        public List<int> Likes { get; set; } = new();
        public List<WallAttachmentMinimal> Attachments { get; set; } = new();
        public List<object> Comments { get; set; } = new();
        public bool IsApproved { get; set; } = true;
        public bool IsRejected { get; set; } = false;
        public bool IsCompanyPost { get; set; } = false;
        public string? GroupName { get; set; }
        public DateTime? ScheduledPublishDate { get; set; }
        public WallController.WallPoll? Poll { get; set; }
    }

    private sealed class WallAttachmentMinimal
    {
        public string FileName { get; set; } = "";
        public string StoredPath { get; set; } = "";
        public long FileSizeBytes { get; set; }
        public string ContentType { get; set; } = "";
    }
}
