using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Common.Models;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.WebApi.Controllers;

[Authorize]
[Route("api/v1/wall")]
public class WallController : ApiControllerBase
{
    private readonly string _dbPath;
    private readonly string _groupsPath;
    private readonly string _uploadDir;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public WallController(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IWebHostEnvironment env)
    {
        _context = context;
        _currentUserService = currentUserService;

        _dbPath = Path.Combine(env.ContentRootPath, "App_Data", "wall_posts.json");
        _groupsPath = Path.Combine(env.ContentRootPath, "App_Data", "wall_groups.json");
        _uploadDir = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads", "wall");

        var dbDir = Path.GetDirectoryName(_dbPath);
        if (dbDir != null && !Directory.Exists(dbDir)) Directory.CreateDirectory(dbDir);
        if (!Directory.Exists(_uploadDir)) Directory.CreateDirectory(_uploadDir);

        if (System.IO.File.Exists(_dbPath))
        {
            var content = System.IO.File.ReadAllText(_dbPath);
            if (content.Contains("Trần Thị Bích Hạnh"))
                System.IO.File.Delete(_dbPath);
        }

        if (!System.IO.File.Exists(_dbPath))
            SeedInitialPosts();

        if (!System.IO.File.Exists(_groupsPath))
            SeedInitialGroups();
    }

    // ── Seed ──────────────────────────────────────────────────────────────

    private void SeedInitialPosts()
    {
        var json = JsonSerializer.Serialize(new List<WallPost>(), new JsonSerializerOptions { WriteIndented = true });
        System.IO.File.WriteAllText(_dbPath, json);
    }

    private void SeedInitialGroups()
    {
        var groups = new List<WallGroup>
        {
            new() { Name = "Thông báo nội bộ", Description = "Thông báo chung của Ban Giám đốc và các phòng ban", CreatedBy = "Admin", CreatedDate = DateTime.Now.AddDays(-30) },
            new() { Name = "Kỹ thuật & Sản xuất", Description = "Thảo luận về quy trình sản xuất và kỹ thuật chế biến gia vị", CreatedBy = "Admin", CreatedDate = DateTime.Now.AddDays(-25) },
            new() { Name = "Kinh doanh & Xuất khẩu", Description = "Chia sẻ thông tin thị trường, đơn hàng và khách hàng", CreatedBy = "Admin", CreatedDate = DateTime.Now.AddDays(-20) },
            new() { Name = "HR & Đào tạo", Description = "Chính sách nhân sự, tuyển dụng và chương trình đào tạo", CreatedBy = "Admin", CreatedDate = DateTime.Now.AddDays(-15) },
        };
        var json = JsonSerializer.Serialize(groups, new JsonSerializerOptions { WriteIndented = true });
        System.IO.File.WriteAllText(_groupsPath, json);
    }

    // ── JSON helpers ──────────────────────────────────────────────────────

    private List<WallPost> LoadPosts()
    {
        if (!System.IO.File.Exists(_dbPath)) SeedInitialPosts();
        return JsonSerializer.Deserialize<List<WallPost>>(System.IO.File.ReadAllText(_dbPath)) ?? new();
    }

    private void SavePosts(List<WallPost> posts)
    {
        System.IO.File.WriteAllText(_dbPath, JsonSerializer.Serialize(posts, new JsonSerializerOptions { WriteIndented = true }));
    }

    private List<WallGroup> LoadGroups()
    {
        if (!System.IO.File.Exists(_groupsPath)) SeedInitialGroups();
        return JsonSerializer.Deserialize<List<WallGroup>>(System.IO.File.ReadAllText(_groupsPath)) ?? new();
    }

    private void SaveGroups(List<WallGroup> groups)
    {
        System.IO.File.WriteAllText(_groupsPath, JsonSerializer.Serialize(groups, new JsonSerializerOptions { WriteIndented = true }));
    }

    // ── GET /wall ─────────────────────────────────────────────────────────

    [HttpGet]
    public IActionResult GetPosts(
        [FromQuery] bool pending = false,
        [FromQuery] bool scheduled = false,
        [FromQuery] string? groupName = null,
        [FromQuery] bool companyOnly = false)
    {
        var posts = LoadPosts();
        var employeeId = _currentUserService.EmployeeId;
        var role = _currentUserService.Role;

        if (pending)
        {
            posts = posts.Where(p => !p.IsApproved && !p.IsRejected).ToList();
            if (role == UserRole.Employee)
                posts = posts.Where(p => p.AuthorId == employeeId).ToList();
        }
        else if (scheduled)
        {
            posts = posts.Where(p => p.ScheduledPublishDate.HasValue && p.ScheduledPublishDate.Value > DateTime.Now).ToList();
            if (role == UserRole.Employee)
                posts = posts.Where(p => p.AuthorId == employeeId).ToList();
        }
        else if (!string.IsNullOrWhiteSpace(groupName))
        {
            posts = posts.Where(p =>
                p.IsApproved && !p.IsRejected &&
                p.GroupName == groupName &&
                (!p.ScheduledPublishDate.HasValue || p.ScheduledPublishDate.Value <= DateTime.Now)).ToList();
        }
        else
        {
            posts = posts.Where(p =>
                p.IsApproved && !p.IsRejected &&
                (!p.ScheduledPublishDate.HasValue || p.ScheduledPublishDate.Value <= DateTime.Now)).ToList();

            if (companyOnly)
                posts = posts.Where(p => p.IsCompanyPost).ToList();
        }

        return Ok(ApiResponse<List<WallPost>>.Ok(posts.OrderByDescending(p => p.CreatedDate).ToList()));
    }

    // ── POST /wall ────────────────────────────────────────────────────────

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreatePost(
        [FromForm] string? title,
        [FromForm] string content,
        [FromForm] List<IFormFile>? files,
        [FromForm] string? groupName,
        [FromForm] DateTime? scheduledPublishDate,
        [FromForm] bool isCompanyPost = false)
    {
        if (string.IsNullOrWhiteSpace(content))
            return BadRequest(ApiResponse<object>.Fail("Nội dung bài viết không được để trống."));

        var employeeId = _currentUserService.EmployeeId;
        var role = _currentUserService.Role;

        if (isCompanyPost && role != UserRole.SuperAdmin && role != UserRole.Manager)
            return Forbid();

        string authorName = "Ẩn danh", authorPosition = "Nhân viên", authorDepartment = "Công ty";
        string? authorAvatarUrl = null;

        if (employeeId.HasValue && employeeId.Value > 0)
        {
            var emp = await _context.Employees.Include(e => e.Department).FirstOrDefaultAsync(e => e.Id == employeeId.Value);
            if (emp != null)
            {
                authorName = emp.FullName;
                authorPosition = emp.Position;
                authorDepartment = emp.Department?.Name ?? "Công ty";
                authorAvatarUrl = emp.AvatarUrl;
            }
        }

        var posts = LoadPosts();
        var newId = posts.Count > 0 ? posts.Max(p => p.Id) + 1 : 1;

        var attachments = new List<WallAttachment>();
        if (files != null)
        {
            foreach (var file in files)
            {
                var storedName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
                var storedPath = Path.Combine(_uploadDir, storedName);
                using var stream = new FileStream(storedPath, FileMode.Create);
                await file.CopyToAsync(stream);
                attachments.Add(new WallAttachment { FileName = file.FileName, StoredPath = storedName, FileSizeBytes = file.Length, ContentType = file.ContentType });
            }
        }

        // Scheduled posts: approved but hidden until date; Employee posts without schedule need approval
        bool isApproved = role == UserRole.SuperAdmin || role == UserRole.Manager || scheduledPublishDate.HasValue;

        var newPost = new WallPost
        {
            Id = newId,
            AuthorId = employeeId ?? 0,
            AuthorName = authorName,
            AuthorPosition = authorPosition,
            AuthorDepartment = authorDepartment,
            AuthorAvatarUrl = authorAvatarUrl,
            Title = string.IsNullOrWhiteSpace(title) ? null : title.Trim(),
            Content = content.Trim(),
            CreatedDate = DateTime.Now,
            Likes = new(),
            Attachments = attachments,
            Comments = new(),
            IsApproved = isApproved,
            IsRejected = false,
            IsCompanyPost = isCompanyPost,
            GroupName = string.IsNullOrWhiteSpace(groupName) ? null : groupName.Trim(),
            ScheduledPublishDate = scheduledPublishDate
        };

        posts.Add(newPost);
        SavePosts(posts);
        return Ok(ApiResponse<WallPost>.Ok(newPost));
    }

    // ── POST /wall/{id}/approve ───────────────────────────────────────────

    [HttpPost("{id:int}/approve")]
    public IActionResult ApprovePost(int id)
    {
        var role = _currentUserService.Role;
        if (role != UserRole.SuperAdmin && role != UserRole.Manager)
            return Forbid();

        var posts = LoadPosts();
        var post = posts.FirstOrDefault(p => p.Id == id);
        if (post == null) return NotFound();

        post.IsApproved = true;
        post.IsRejected = false;
        SavePosts(posts);
        return Ok(ApiResponse<WallPost>.Ok(post));
    }

    // ── POST /wall/{id}/reject ────────────────────────────────────────────

    [HttpPost("{id:int}/reject")]
    public IActionResult RejectPost(int id)
    {
        var role = _currentUserService.Role;
        if (role != UserRole.SuperAdmin && role != UserRole.Manager)
            return Forbid();

        var posts = LoadPosts();
        var post = posts.FirstOrDefault(p => p.Id == id);
        if (post == null) return NotFound();

        post.IsApproved = false;
        post.IsRejected = true;
        SavePosts(posts);
        return Ok(ApiResponse<WallPost>.Ok(post));
    }

    // ── POST /wall/{id}/publish-now ────────────────────────────────────────

    [HttpPost("{id:int}/publish-now")]
    public IActionResult PublishNow(int id)
    {
        var employeeId = _currentUserService.EmployeeId;
        var role = _currentUserService.Role;

        var posts = LoadPosts();
        var post = posts.FirstOrDefault(p => p.Id == id);
        if (post == null) return NotFound();

        if (post.AuthorId != employeeId && role != UserRole.SuperAdmin && role != UserRole.Manager)
            return Forbid();

        post.ScheduledPublishDate = null;
        SavePosts(posts);
        return Ok(ApiResponse<WallPost>.Ok(post));
    }

    // ── POST /wall/{id}/like ──────────────────────────────────────────────

    [HttpPost("{id:int}/like")]
    public IActionResult ToggleLike(int id)
    {
        var employeeId = _currentUserService.EmployeeId;
        if (employeeId == null || employeeId == 0) return Unauthorized();

        var posts = LoadPosts();
        var post = posts.FirstOrDefault(p => p.Id == id);
        if (post == null) return NotFound();

        if (post.Likes.Contains(employeeId.Value)) post.Likes.Remove(employeeId.Value);
        else post.Likes.Add(employeeId.Value);

        SavePosts(posts);
        return Ok(ApiResponse<WallPost>.Ok(post));
    }

    // ── POST /wall/{id}/comments ──────────────────────────────────────────

    [HttpPost("{id:int}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromForm] string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return BadRequest(ApiResponse<object>.Fail("Nội dung bình luận không được để trống."));

        var employeeId = _currentUserService.EmployeeId;
        string authorName = "Ẩn danh", authorPosition = "Nhân viên";

        if (employeeId.HasValue && employeeId.Value > 0)
        {
            var emp = await _context.Employees.FirstOrDefaultAsync(e => e.Id == employeeId.Value);
            if (emp != null) { authorName = emp.FullName; authorPosition = emp.Position; }
        }

        var posts = LoadPosts();
        var post = posts.FirstOrDefault(p => p.Id == id);
        if (post == null) return NotFound();

        var comment = new WallComment
        {
            Id = post.Comments.Count > 0 ? post.Comments.Max(c => c.Id) + 1 : 1,
            AuthorId = employeeId ?? 0,
            AuthorName = authorName,
            AuthorPosition = authorPosition,
            Content = content.Trim(),
            CreatedDate = DateTime.Now
        };

        post.Comments.Add(comment);
        SavePosts(posts);
        return Ok(ApiResponse<WallComment>.Ok(comment));
    }

    // ── POST /wall/{id}/delete ────────────────────────────────────────────

    [HttpPost("{id:int}/delete")]
    public IActionResult DeletePost(int id)
    {
        var employeeId = _currentUserService.EmployeeId;
        var role = _currentUserService.Role;

        var posts = LoadPosts();
        var post = posts.FirstOrDefault(p => p.Id == id);
        if (post == null) return NotFound();

        if (post.AuthorId != employeeId && role != UserRole.SuperAdmin)
            return Forbid();

        foreach (var att in post.Attachments)
        {
            var filePath = Path.Combine(_uploadDir, att.StoredPath);
            if (System.IO.File.Exists(filePath)) try { System.IO.File.Delete(filePath); } catch { }
        }

        posts.Remove(post);
        SavePosts(posts);
        return Ok(ApiResponse<object>.Ok("Xóa bài viết thành công."));
    }

    // ── POST /wall/{id}/update ────────────────────────────────────────────

    [HttpPost("{id:int}/update")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdatePost(
        int id,
        [FromForm] string? title,
        [FromForm] string content,
        [FromForm] List<IFormFile>? files,
        [FromForm] string? keptAttachmentsJson,
        [FromForm] DateTime? scheduledPublishDate)
    {
        if (string.IsNullOrWhiteSpace(content))
            return BadRequest(ApiResponse<object>.Fail("Nội dung bài viết không được để trống."));

        var employeeId = _currentUserService.EmployeeId;
        var role = _currentUserService.Role;

        var posts = LoadPosts();
        var post = posts.FirstOrDefault(p => p.Id == id);
        if (post == null) return NotFound();

        if (post.AuthorId != employeeId && role != UserRole.SuperAdmin)
            return Forbid();

        post.Title = string.IsNullOrWhiteSpace(title) ? null : title.Trim();
        post.Content = content.Trim();
        if (scheduledPublishDate.HasValue) post.ScheduledPublishDate = scheduledPublishDate;

        var keptAttachments = new List<WallAttachment>();
        if (!string.IsNullOrEmpty(keptAttachmentsJson))
        {
            try
            {
                var keptFiles = JsonSerializer.Deserialize<List<string>>(keptAttachmentsJson) ?? new();
                foreach (var att in post.Attachments)
                {
                    if (keptFiles.Contains(att.FileName) || keptFiles.Contains(att.StoredPath))
                        keptAttachments.Add(att);
                    else
                    {
                        var fp = Path.Combine(_uploadDir, att.StoredPath);
                        if (System.IO.File.Exists(fp)) try { System.IO.File.Delete(fp); } catch { }
                    }
                }
            }
            catch { keptAttachments = post.Attachments; }
        }
        else
        {
            foreach (var att in post.Attachments)
            {
                var fp = Path.Combine(_uploadDir, att.StoredPath);
                if (System.IO.File.Exists(fp)) try { System.IO.File.Delete(fp); } catch { }
            }
        }
        post.Attachments = keptAttachments;

        if (files != null)
        {
            foreach (var file in files)
            {
                var storedName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
                var storedPath = Path.Combine(_uploadDir, storedName);
                using var stream = new FileStream(storedPath, FileMode.Create);
                await file.CopyToAsync(stream);
                post.Attachments.Add(new WallAttachment { FileName = file.FileName, StoredPath = storedName, FileSizeBytes = file.Length, ContentType = file.ContentType });
            }
        }

        SavePosts(posts);
        return Ok(ApiResponse<WallPost>.Ok(post));
    }

    // ── GET /wall/download/{postId}/{fileName} ────────────────────────────

    [HttpGet("download/{postId:int}/{fileName}")]
    public IActionResult DownloadAttachment(int postId, string fileName)
    {
        var posts = LoadPosts();
        var post = posts.FirstOrDefault(p => p.Id == postId);
        if (post == null) return NotFound();

        var attachment = post.Attachments.FirstOrDefault(a => a.FileName == fileName || a.StoredPath == fileName);
        if (attachment == null) return NotFound();

        var filePath = Path.Combine(_uploadDir, attachment.StoredPath);
        if (!System.IO.File.Exists(filePath))
            System.IO.File.WriteAllText(filePath, "%PDF-1.4 ... Dummy PDF content.");

        return File(System.IO.File.ReadAllBytes(filePath), attachment.ContentType, attachment.FileName);
    }

    // ── GET /wall/groups ──────────────────────────────────────────────────

    [HttpGet("groups")]
    public IActionResult GetGroups()
    {
        var groups = LoadGroups();
        var posts = LoadPosts();

        var result = groups.Select(g => new WallGroupDto
        {
            Name = g.Name,
            Description = g.Description,
            CreatedBy = g.CreatedBy,
            CreatedDate = g.CreatedDate,
            PostCount = posts.Count(p => p.GroupName == g.Name && p.IsApproved && !p.IsRejected
                                         && (!p.ScheduledPublishDate.HasValue || p.ScheduledPublishDate.Value <= DateTime.Now))
        }).OrderBy(g => g.Name).ToList();

        return Ok(ApiResponse<List<WallGroupDto>>.Ok(result));
    }

    // ── POST /wall/groups ─────────────────────────────────────────────────

    [HttpPost("groups")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<object>.Fail("Tên nhóm không được để trống."));

        var groups = LoadGroups();
        if (groups.Any(g => g.Name.Equals(request.Name.Trim(), StringComparison.OrdinalIgnoreCase)))
            return BadRequest(ApiResponse<object>.Fail("Nhóm thảo luận này đã tồn tại."));

        var employeeId = _currentUserService.EmployeeId;
        string createdBy = "Admin";
        if (employeeId.HasValue && employeeId.Value > 0)
        {
            var emp = await _context.Employees.FirstOrDefaultAsync(e => e.Id == employeeId.Value);
            if (emp != null) createdBy = emp.FullName;
        }

        var newGroup = new WallGroup
        {
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            CreatedBy = createdBy,
            CreatedDate = DateTime.Now
        };

        groups.Add(newGroup);
        SaveGroups(groups);
        return Ok(ApiResponse<WallGroup>.Ok(newGroup));
    }

    // ── DELETE /wall/groups/{name} ────────────────────────────────────────

    [HttpDelete("groups/{name}")]
    public IActionResult DeleteGroup(string name)
    {
        var role = _currentUserService.Role;
        if (role != UserRole.SuperAdmin && role != UserRole.Manager)
            return Forbid();

        var groups = LoadGroups();
        var group = groups.FirstOrDefault(g => g.Name == name);
        if (group == null) return NotFound();

        groups.Remove(group);
        SaveGroups(groups);
        return Ok(ApiResponse<object>.Ok("Đã xóa nhóm thảo luận."));
    }

    // ── Models ────────────────────────────────────────────────────────────

    public class WallPost
    {
        public int Id { get; set; }
        public int AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorPosition { get; set; }
        public string? AuthorDepartment { get; set; }
        public string? AuthorAvatarUrl { get; set; }
        public string? Title { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public List<int> Likes { get; set; } = new();
        public List<WallAttachment> Attachments { get; set; } = new();
        public List<WallComment> Comments { get; set; } = new();
        public bool IsApproved { get; set; } = true;
        public bool IsRejected { get; set; } = false;
        public bool IsCompanyPost { get; set; } = false;
        public string? GroupName { get; set; }
        public DateTime? ScheduledPublishDate { get; set; }
    }

    public class WallAttachment
    {
        public string FileName { get; set; } = string.Empty;
        public string StoredPath { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string ContentType { get; set; } = string.Empty;
    }

    public class WallComment
    {
        public int Id { get; set; }
        public int AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorPosition { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
    }

    public class WallGroup
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class WallGroupDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public int PostCount { get; set; }
    }

    public class CreateGroupRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
