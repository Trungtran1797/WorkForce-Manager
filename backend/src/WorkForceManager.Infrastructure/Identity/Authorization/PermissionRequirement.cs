using Microsoft.AspNetCore.Authorization;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Infrastructure.Identity.Authorization;

/// <summary>
/// Yêu cầu authorization dựa trên ma trận phân quyền động: user phải có quyền hiệu lực
/// (effective permission) trên <see cref="Module"/> >= <see cref="MinLevel"/>.
/// </summary>
public record PermissionRequirement(PermissionModule Module, PermissionLevel MinLevel) : IAuthorizationRequirement;
