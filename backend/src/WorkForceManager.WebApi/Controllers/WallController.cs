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
        _uploadDir = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads", "wall");

        // Ensure directories exist
        var dbDir = Path.GetDirectoryName(_dbPath);
        if (dbDir != null && !Directory.Exists(dbDir)) Directory.CreateDirectory(dbDir);
        if (!Directory.Exists(_uploadDir)) Directory.CreateDirectory(_uploadDir);

        if (System.IO.File.Exists(_dbPath))
        {
            var content = System.IO.File.ReadAllText(_dbPath);
            if (content.Contains("Trần Thị Bích Hạnh"))
            {
                System.IO.File.Delete(_dbPath);
            }
        }

        if (!System.IO.File.Exists(_dbPath))
        {
            SeedInitialPosts();
        }
    }

    private void EnsureDummyFileExists(string fileName)
    {
        var filePath = Path.Combine(_uploadDir, fileName);
        if (!System.IO.File.Exists(filePath))
        {
            System.IO.File.WriteAllText(filePath, "%PDF-1.4 ... Dummy PDF content for Saigon Spices Wall Attachment.");
        }
    }

    private void SeedInitialPosts()
    {
        var posts = new List<WallPost>();
        var json = JsonSerializer.Serialize(posts, new JsonSerializerOptions { WriteIndented = true });
        System.IO.File.WriteAllText(_dbPath, json);
    }

    private List<WallPost> LoadPosts()
    {
        if (!System.IO.File.Exists(_dbPath)) SeedInitialPosts();
        var json = System.IO.File.ReadAllText(_dbPath);
        return JsonSerializer.Deserialize<List<WallPost>>(json) ?? new();
    }

    private void SavePosts(List<WallPost> posts)
    {
        var json = JsonSerializer.Serialize(posts, new JsonSerializerOptions { WriteIndented = true });
        System.IO.File.WriteAllText(_dbPath, json);
    }

    [HttpGet]
    public IActionResult GetPosts()
    {
        var posts = LoadPosts();
        posts = posts.OrderByDescending(p => p.CreatedDate).ToList();
        return Ok(ApiResponse<List<WallPost>>.Ok(posts));
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreatePost(
        [FromForm] string? title,
        [FromForm] string content,
        [FromForm] List<IFormFile>? files,
        [FromForm] string? groupName,
        [FromForm] DateTime? scheduledPublishDate)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return BadRequest(ApiResponse<object>.Fail("Nội dung bài viết không được để trống."));
        }

        var employeeId = _currentUserService.EmployeeId;
        var role = _currentUserService.Role;
        string authorName = "Ẩn danh";
        string authorPosition = "Nhân viên";
        string authorDepartment = "Công ty";

        if (employeeId.HasValue && employeeId.Value > 0)
        {
            var emp = await _context.Employees
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e => e.Id == employeeId.Value);
            if (emp != null)
            {
                authorName = emp.FullName;
                authorPosition = emp.Position;
                authorDepartment = emp.Department?.Name ?? "Công ty";
            }
        }

        var posts = LoadPosts();
        var newId = posts.Count > 0 ? posts.Max(p => p.Id) + 1 : 1;

        var attachments = new List<WallAttachment>();
        if (files != null && files.Count > 0)
        {
            foreach (var file in files)
            {
                var fileGuid = Guid.NewGuid().ToString("N");
                var extension = Path.GetExtension(file.FileName);
                var storedName = $"{fileGuid}{extension}";
                var storedPath = Path.Combine(_uploadDir, storedName);

                using (var stream = new FileStream(storedPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                attachments.Add(new WallAttachment
                {
                    FileName = file.FileName,
                    StoredPath = storedName,
                    FileSizeBytes = file.Length,
                    ContentType = file.ContentType
                });
            }
        }

        // Auto-approve if Manager or Admin
        bool isApproved = role == UserRole.SuperAdmin || role == UserRole.Manager;

        var newPost = new WallPost
        {
            Id = newId,
            AuthorId = employeeId ?? 0,
            AuthorName = authorName,
            AuthorPosition = authorPosition,
            AuthorDepartment = authorDepartment,
            Title = string.IsNullOrWhiteSpace(title) ? null : title.Trim(),
            Content = content.Trim(),
            CreatedDate = DateTime.Now,
            Likes = new List<int>(),
            Attachments = attachments,
            Comments = new List<WallComment>(),
            IsApproved = isApproved,
            GroupName = string.IsNullOrWhiteSpace(groupName) ? null : groupName.Trim(),
            ScheduledPublishDate = scheduledPublishDate
        };

        posts.Add(newPost);
        SavePosts(posts);

        return Ok(ApiResponse<WallPost>.Ok(newPost));
    }

    [HttpPost("{id:int}/approve")]
    public IActionResult ApprovePost(int id)
    {
        var role = _currentUserService.Role;
        if (role != UserRole.SuperAdmin && role != UserRole.Manager)
        {
            return Forbid();
        }

        var posts = LoadPosts();
        var post = posts.FirstOrDefault(p => p.Id == id);
        if (post == null) return NotFound();

        post.IsApproved = true;
        SavePosts(posts);

        return Ok(ApiResponse<WallPost>.Ok(post));
    }

    [HttpPost("{id:int}/like")]
    public IActionResult ToggleLike(int id)
    {
        var employeeId = _currentUserService.EmployeeId;
        if (employeeId == null || employeeId == 0)
        {
            return Unauthorized();
        }

        var posts = LoadPosts();
        var post = posts.FirstOrDefault(p => p.Id == id);
        if (post == null) return NotFound();

        if (post.Likes.Contains(employeeId.Value))
        {
            post.Likes.Remove(employeeId.Value);
        }
        else
        {
            post.Likes.Add(employeeId.Value);
        }

        SavePosts(posts);
        return Ok(ApiResponse<WallPost>.Ok(post));
    }

    [HttpPost("{id:int}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromForm] string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return BadRequest(ApiResponse<object>.Fail("Nội dung bình luận không được để trống."));
        }

        var employeeId = _currentUserService.EmployeeId;
        string authorName = "Ẩn danh";
        string authorPosition = "Nhân viên";

        if (employeeId.HasValue && employeeId.Value > 0)
        {
            var emp = await _context.Employees.FirstOrDefaultAsync(e => e.Id == employeeId.Value);
            if (emp != null)
            {
                authorName = emp.FullName;
                authorPosition = emp.Position;
            }
        }

        var posts = LoadPosts();
        var post = posts.FirstOrDefault(p => p.Id == id);
        if (post == null) return NotFound();

        var commentId = post.Comments.Count > 0 ? post.Comments.Max(c => c.Id) + 1 : 1;
        var comment = new WallComment
        {
            Id = commentId,
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

    [HttpPost("{id:int}/delete")]
    public IActionResult DeletePost(int id)
    {
        var employeeId = _currentUserService.EmployeeId;
        var role = _currentUserService.Role;

        var posts = LoadPosts();
        var post = posts.FirstOrDefault(p => p.Id == id);
        if (post == null) return NotFound();

        if (post.AuthorId == employeeId || role == UserRole.SuperAdmin)
        {
            foreach (var att in post.Attachments)
            {
                var filePath = Path.Combine(_uploadDir, att.StoredPath);
                if (System.IO.File.Exists(filePath))
                {
                    try { System.IO.File.Delete(filePath); } catch {}
                }
            }

            posts.Remove(post);
            SavePosts(posts);
            return Ok(ApiResponse<object>.Ok("Xóa bài viết thành công."));
        }

        return Forbid();
    }

    [HttpPost("{id:int}/update")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdatePost(
        int id,
        [FromForm] string? title,
        [FromForm] string content,
        [FromForm] List<IFormFile>? files,
        [FromForm] string? keptAttachmentsJson)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return BadRequest(ApiResponse<object>.Fail("Nội dung bài viết không được để trống."));
        }

        var employeeId = _currentUserService.EmployeeId;
        var role = _currentUserService.Role;

        var posts = LoadPosts();
        var post = posts.FirstOrDefault(p => p.Id == id);
        if (post == null) return NotFound();

        if (post.AuthorId != employeeId && role != UserRole.SuperAdmin)
        {
            return Forbid();
        }

        post.Title = string.IsNullOrWhiteSpace(title) ? null : title.Trim();
        post.Content = content.Trim();

        var keptAttachments = new List<WallAttachment>();
        if (!string.IsNullOrEmpty(keptAttachmentsJson))
        {
            try
            {
                var keptFiles = JsonSerializer.Deserialize<List<string>>(keptAttachmentsJson) ?? new();
                foreach (var att in post.Attachments)
                {
                    if (keptFiles.Contains(att.FileName) || keptFiles.Contains(att.StoredPath))
                    {
                        keptAttachments.Add(att);
                    }
                    else
                    {
                        var filePath = Path.Combine(_uploadDir, att.StoredPath);
                        if (System.IO.File.Exists(filePath))
                        {
                            try { System.IO.File.Delete(filePath); } catch {}
                        }
                    }
                }
            }
            catch
            {
                keptAttachments = post.Attachments;
            }
        }
        else
        {
            foreach (var att in post.Attachments)
            {
                var filePath = Path.Combine(_uploadDir, att.StoredPath);
                if (System.IO.File.Exists(filePath))
                {
                    try { System.IO.File.Delete(filePath); } catch {}
                }
            }
        }

        post.Attachments = keptAttachments;

        if (files != null && files.Count > 0)
        {
            foreach (var file in files)
            {
                var fileGuid = Guid.NewGuid().ToString("N");
                var extension = Path.GetExtension(file.FileName);
                var storedName = $"{fileGuid}{extension}";
                var storedPath = Path.Combine(_uploadDir, storedName);

                using (var stream = new FileStream(storedPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                post.Attachments.Add(new WallAttachment
                {
                    FileName = file.FileName,
                    StoredPath = storedName,
                    FileSizeBytes = file.Length,
                    ContentType = file.ContentType
                });
            }
        }

        SavePosts(posts);
        return Ok(ApiResponse<WallPost>.Ok(post));
    }

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
        {
            System.IO.File.WriteAllText(filePath, "%PDF-1.4 ... Dummy PDF content for Saigon Spices Wall Attachment.");
        }

        var fileBytes = System.IO.File.ReadAllBytes(filePath);
        return File(fileBytes, attachment.ContentType, attachment.FileName);
    }

    public class WallPost
    {
        public int Id { get; set; }
        public int AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorPosition { get; set; }
        public string? AuthorDepartment { get; set; }
        public string? Title { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public List<int> Likes { get; set; } = new();
        public List<WallAttachment> Attachments { get; set; } = new();
        public List<WallComment> Comments { get; set; } = new();
        public bool IsApproved { get; set; } = true;
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
}
