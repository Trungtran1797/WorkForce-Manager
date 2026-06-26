using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;

namespace WorkForceManager.Infrastructure.Persistence.Seed;

public static class ApplicationDbContextSeed
{
    /// <summary>Apply migration + seed dữ liệu khởi tạo. Gọi lúc startup (Development).</summary>
    public static async Task InitialiseAndSeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var logger = sp.GetRequiredService<ILogger<ApplicationDbContext>>();

        try
        {
            var context = sp.GetRequiredService<ApplicationDbContext>();
            var hasher = sp.GetRequiredService<IPasswordHasher>();

            if (context.Database.IsSqlite())
            {
                await context.Database.EnsureCreatedAsync();
            }
            else
            {
                await context.Database.MigrateAsync();
            }
            await SeedAsync(context, hasher);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi khởi tạo/seed database.");
            throw;
        }
    }

    private static async Task SeedAsync(ApplicationDbContext context, IPasswordHasher hasher)
    {
        await SeedDepartmentsAndEmployeesAsync(context);
        await SeedUsersAsync(context, hasher);
        await SeedProjectsAndTasksAsync(context);
        await SeedExportOrderTemplateAsync(context);
        await SeedDomesticOrderTemplateAsync(context);
        await SeedProcurementTemplateAsync(context);
        await SeedShiftsAndLocationsAsync(context);
        await SeedPayrollAsync(context);
        await SeedPermissionMatrixAsync(context);
        await SeedSystemSettingsAsync(context);
    }

    private static async Task SeedSystemSettingsAsync(ApplicationDbContext context)
    {
        if (await context.SystemSettings.AnyAsync()) return;

        context.SystemSettings.Add(new Domain.Entities.SystemSetting
        {
            Key = "OneDriveProjectsBasePath",
            Value = string.Empty,
            Description = "Đường dẫn thư mục gốc chứa các dự án trên OneDrive (hoặc ổ đĩa chia sẻ). Để trống nếu không dùng tính năng đồng bộ thư mục.",
            UpdatedDate = DateTime.UtcNow
        });

        await context.SaveChangesAsync();
    }

    private static async Task SeedPermissionMatrixAsync(ApplicationDbContext context)
    {
        if (!await context.RolePermissions.AnyAsync())
        {
            // Ma trận quyền theo Role x Module - dựa theo docs/phan-quyen-truy-cap.md Bảng 1.
            var matrix = new (PermissionModule Module, PermissionLevel SuperAdmin, PermissionLevel Manager, PermissionLevel Employee)[]
            {
                (PermissionModule.Dashboard, PermissionLevel.Edit, PermissionLevel.View, PermissionLevel.View),
                (PermissionModule.Employees, PermissionLevel.Edit, PermissionLevel.Edit, PermissionLevel.View),
                (PermissionModule.Departments, PermissionLevel.Edit, PermissionLevel.View, PermissionLevel.None),
                (PermissionModule.Projects, PermissionLevel.Edit, PermissionLevel.Edit, PermissionLevel.View),
                (PermissionModule.Tasks, PermissionLevel.Edit, PermissionLevel.Edit, PermissionLevel.Edit),
                (PermissionModule.Attendance, PermissionLevel.Edit, PermissionLevel.Edit, PermissionLevel.Edit),
                (PermissionModule.Leave, PermissionLevel.Edit, PermissionLevel.Edit, PermissionLevel.Edit),
                (PermissionModule.Overtime, PermissionLevel.Edit, PermissionLevel.Edit, PermissionLevel.Edit),
                (PermissionModule.Shifts, PermissionLevel.Edit, PermissionLevel.View, PermissionLevel.View),
                (PermissionModule.OfficeLocations, PermissionLevel.Edit, PermissionLevel.View, PermissionLevel.None),
                (PermissionModule.Contracts, PermissionLevel.Edit, PermissionLevel.View, PermissionLevel.View),
                (PermissionModule.Payroll, PermissionLevel.Edit, PermissionLevel.None, PermissionLevel.None),
                (PermissionModule.SalaryConfigs, PermissionLevel.Edit, PermissionLevel.None, PermissionLevel.None),
                (PermissionModule.Payslips, PermissionLevel.Edit, PermissionLevel.View, PermissionLevel.View),
                (PermissionModule.Okrs, PermissionLevel.Edit, PermissionLevel.Edit, PermissionLevel.Edit),
                (PermissionModule.Performance, PermissionLevel.Edit, PermissionLevel.Edit, PermissionLevel.Edit),
                (PermissionModule.Training, PermissionLevel.Edit, PermissionLevel.Edit, PermissionLevel.View),
                (PermissionModule.Reports, PermissionLevel.Edit, PermissionLevel.View, PermissionLevel.None),
                (PermissionModule.Notifications, PermissionLevel.Edit, PermissionLevel.Edit, PermissionLevel.Edit),
                (PermissionModule.PermissionMatrix, PermissionLevel.Edit, PermissionLevel.None, PermissionLevel.None)
            };

            var rolePermissions = new List<RolePermission>();
            foreach (var (module, superAdminLevel, managerLevel, employeeLevel) in matrix)
            {
                rolePermissions.Add(new RolePermission { Role = UserRole.SuperAdmin, Module = module, Level = superAdminLevel });
                rolePermissions.Add(new RolePermission { Role = UserRole.Manager, Module = module, Level = managerLevel });
                rolePermissions.Add(new RolePermission { Role = UserRole.Employee, Module = module, Level = employeeLevel });
            }

            await context.RolePermissions.AddRangeAsync(rolePermissions);
            await context.SaveChangesAsync();
        }

        if (!await context.DepartmentPermissionOverrides.AnyAsync())
        {
            var departments = await context.Departments.ToListAsync();

            var overrides = new List<DepartmentPermissionOverride>();

            AddOverrides(overrides, departments, "Phòng HCNS-Tổng hợp",
                (PermissionModule.Employees, PermissionLevel.Edit),
                (PermissionModule.Departments, PermissionLevel.Edit),
                (PermissionModule.Contracts, PermissionLevel.Edit));

            AddOverrides(overrides, departments, "Phòng Kế toán",
                (PermissionModule.Payroll, PermissionLevel.Edit),
                (PermissionModule.SalaryConfigs, PermissionLevel.Edit),
                (PermissionModule.Contracts, PermissionLevel.Edit),
                (PermissionModule.Reports, PermissionLevel.Edit));

            AddOverrides(overrides, departments, "Phòng Kinh doanh",
                (PermissionModule.Projects, PermissionLevel.Edit),
                (PermissionModule.Reports, PermissionLevel.Edit));

            AddOverrides(overrides, departments, "Phòng Logistics",
                (PermissionModule.OfficeLocations, PermissionLevel.Edit));

            AddOverrides(overrides, departments, "Kho - Tổng hợp",
                (PermissionModule.Shifts, PermissionLevel.Edit));

            AddOverrides(overrides, departments, "QA-QC",
                (PermissionModule.Shifts, PermissionLevel.Edit));

            AddOverrides(overrides, departments, "Sản xuất",
                (PermissionModule.Shifts, PermissionLevel.Edit));

            if (overrides.Count > 0)
            {
                await context.DepartmentPermissionOverrides.AddRangeAsync(overrides);
                await context.SaveChangesAsync();
            }
        }
    }

    private static void AddOverrides(
        List<DepartmentPermissionOverride> overrides,
        List<Department> departments,
        string departmentName,
        params (PermissionModule Module, PermissionLevel Level)[] permissions)
    {
        var department = departments.FirstOrDefault(d => d.Name == departmentName);
        if (department is null)
        {
            return;
        }

        foreach (var (module, level) in permissions)
        {
            overrides.Add(new DepartmentPermissionOverride
            {
                DepartmentId = department.Id,
                Module = module,
                Level = level
            });
        }
    }

    private static async Task SeedPayrollAsync(ApplicationDbContext context)
    {
        if (!await context.TaxBrackets.AnyAsync())
        {
            // Biểu thuế TNCN lũy tiến từng phần theo tháng (đơn vị VND).
            var brackets = new List<TaxBracket>
            {
                new() { Order = 1, FromAmount = 0, ToAmount = 5_000_000m, Rate = 0.05m },
                new() { Order = 2, FromAmount = 5_000_000m, ToAmount = 10_000_000m, Rate = 0.10m },
                new() { Order = 3, FromAmount = 10_000_000m, ToAmount = 18_000_000m, Rate = 0.15m },
                new() { Order = 4, FromAmount = 18_000_000m, ToAmount = 32_000_000m, Rate = 0.20m },
                new() { Order = 5, FromAmount = 32_000_000m, ToAmount = 52_000_000m, Rate = 0.25m },
                new() { Order = 6, FromAmount = 52_000_000m, ToAmount = 80_000_000m, Rate = 0.30m },
                new() { Order = 7, FromAmount = 80_000_000m, ToAmount = null, Rate = 0.35m }
            };
            await context.TaxBrackets.AddRangeAsync(brackets);
            await context.SaveChangesAsync();
        }

        if (!await context.SalaryConfigs.AnyAsync())
        {
            var employees = await context.Employees.OrderBy(e => e.Id).ToListAsync();
            decimal[] baseSalaries = { 30_000_000m, 25_000_000m, 18_000_000m, 15_000_000m, 28_000_000m };
            var configs = employees.Select((e, i) => new SalaryConfig
            {
                EmployeeId = e.Id,
                BaseSalary = baseSalaries[i % baseSalaries.Length],
                Allowance = 2_000_000m,
                InsuranceSalary = baseSalaries[i % baseSalaries.Length],
                DependentCount = i % 3
            }).ToList();
            await context.SalaryConfigs.AddRangeAsync(configs);
            await context.SaveChangesAsync();
        }
    }

    private static async Task SeedShiftsAndLocationsAsync(ApplicationDbContext context)
    {
        if (!await context.Shifts.AnyAsync())
        {
            var shifts = new List<Shift>
            {
                new() { Code = "HC", Name = "Ca hành chính", StartTime = new TimeOnly(8, 30), EndTime = new TimeOnly(17, 30), BreakMinutes = 60, ShiftType = ShiftType.Administrative, IsActive = true },
                new() { Code = "S1", Name = "Ca sáng", StartTime = new TimeOnly(6, 0), EndTime = new TimeOnly(14, 0), BreakMinutes = 30, ShiftType = ShiftType.Shift, IsActive = true },
                new() { Code = "S2", Name = "Ca chiều", StartTime = new TimeOnly(14, 0), EndTime = new TimeOnly(22, 0), BreakMinutes = 30, ShiftType = ShiftType.Shift, IsActive = true },
                new() { Code = "S3", Name = "Ca đêm", StartTime = new TimeOnly(22, 0), EndTime = new TimeOnly(6, 0), BreakMinutes = 45, ShiftType = ShiftType.Night, IsActive = true }
            };
            await context.Shifts.AddRangeAsync(shifts);
            await context.SaveChangesAsync();
        }

        if (!await context.OfficeLocations.AnyAsync())
        {
            // Để IsActive = false để không chặn luồng check-in hiện tại; admin bật khi cần ràng buộc.
            var location = new OfficeLocation
            {
                Name = "Trụ sở chính",
                AllowedIpRanges = "192.168.0.0/16,10.0.0.0/8",
                Latitude = 21.028511,
                Longitude = 105.804817,
                RadiusMeters = 200,
                IsActive = false
            };
            await context.OfficeLocations.AddAsync(location);
            await context.SaveChangesAsync();
        }
    }

    private static async Task SeedProjectsAndTasksAsync(ApplicationDbContext context)
    {
        if (await context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Code == "DA001"))
        {
            return;
        }

        var employees = await context.Employees.OrderBy(e => e.Id).ToListAsync();
        if (employees.Count == 0)
        {
            return;
        }

        var projects = new List<Project>
        {
            new()
            {
                Code = "DA001", Name = "Hệ thống ERP nội bộ", Investor = "Công ty WorkForce",
                StartDate = new DateTime(2025, 1, 6), EndDate = new DateTime(2025, 9, 30),
                Status = ProjectStatus.InProgress, Budget = 1_500_000_000m,
                Description = "Xây dựng hệ thống quản trị nguồn lực doanh nghiệp.", Progress = 65
            },
            new()
            {
                Code = "DA002", Name = "Website thương mại điện tử", Investor = "Đối tác ABC",
                StartDate = new DateTime(2025, 3, 1), EndDate = new DateTime(2025, 8, 15),
                Status = ProjectStatus.Planning, Budget = 800_000_000m,
                Description = "Phát triển nền tảng bán hàng online.", Progress = 20
            },
            new()
            {
                Code = "DA003", Name = "Ứng dụng chấm công di động", Investor = "Công ty WorkForce",
                StartDate = new DateTime(2024, 10, 1), EndDate = new DateTime(2025, 2, 28),
                Status = ProjectStatus.Completed, Budget = 450_000_000m,
                Description = "App mobile chấm công GPS + QR.", Progress = 100
            },
            new()
            {
                Code = "DA004", Name = "Quy trình xử lý đơn hàng xuất khẩu", Investor = "SAIGON SPICES",
                StartDate = new DateTime(2025, 6, 1), EndDate = new DateTime(2025, 6, 30),
                Status = ProjectStatus.InProgress, Budget = 50_000_000m,
                Description = "Quy trình phối hợp giữa Kinh doanh, Nhà máy, Logistics, Kế toán và Ban giám đốc để xử lý một đơn hàng xuất khẩu gia vị hồ tiêu, từ tạo hợp đồng đến xuất hóa đơn và giao hàng.",
                Progress = 45
            }
        };
        await context.Projects.AddRangeAsync(projects);
        await context.SaveChangesAsync();

        projects[0].Members.Add(new ProjectMember { EmployeeId = employees[0].Id, RoleInProject = "Project Lead", JoinedDate = projects[0].StartDate });
        projects[0].Members.Add(new ProjectMember { EmployeeId = employees[2].Id, RoleInProject = "Developer", JoinedDate = projects[0].StartDate });
        projects[1].Members.Add(new ProjectMember { EmployeeId = employees[1].Id, RoleInProject = "Project Manager", JoinedDate = projects[1].StartDate });

        // DA004 - Quy trình xử lý đơn hàng xuất khẩu: thành viên đại diện các phòng liên quan.
        var nv001 = employees.First(e => e.EmployeeCode == "NV001"); // Phòng Kinh doanh
        var nv002 = employees.First(e => e.EmployeeCode == "NV002"); // Ban giám đốc
        var nv003 = employees.First(e => e.EmployeeCode == "NV003"); // Sản xuất
        var nv005 = employees.First(e => e.EmployeeCode == "NV005"); // Phòng Kế toán
        var nv006 = employees.First(e => e.EmployeeCode == "NV006"); // Phòng Logistics

        projects[3].Members.Add(new ProjectMember { EmployeeId = nv001.Id, RoleInProject = "Phụ trách Kinh doanh (Process Owner)", JoinedDate = projects[3].StartDate });
        projects[3].Members.Add(new ProjectMember { EmployeeId = nv002.Id, RoleInProject = "Ban giám đốc", JoinedDate = projects[3].StartDate });
        projects[3].Members.Add(new ProjectMember { EmployeeId = nv003.Id, RoleInProject = "Sản xuất", JoinedDate = projects[3].StartDate });
        projects[3].Members.Add(new ProjectMember { EmployeeId = nv005.Id, RoleInProject = "Kế toán", JoinedDate = projects[3].StartDate });
        projects[3].Members.Add(new ProjectMember { EmployeeId = nv006.Id, RoleInProject = "Logistics", JoinedDate = projects[3].StartDate });
        await context.SaveChangesAsync();

        var assignee = employees[2];
        var assigner = employees[0];
        var tasks = new List<TaskItem>
        {
            new() { Code = "CV001", Title = "Thiết kế cơ sở dữ liệu", Description = "Thiết kế ERD và schema.", AssigneeId = assignee.Id, AssignerId = assigner.Id, Priority = TaskPriority.High, Status = WorkTaskStatus.Done, StartDate = new DateTime(2025, 1, 6), DueDate = new DateTime(2025, 1, 20), Progress = 100, ProjectId = projects[0].Id },
            new() { Code = "CV002", Title = "Xây dựng API Authentication", Description = "JWT + refresh token.", AssigneeId = assignee.Id, AssignerId = assigner.Id, Priority = TaskPriority.High, Status = WorkTaskStatus.InProgress, StartDate = new DateTime(2025, 1, 21), DueDate = new DateTime(2025, 2, 10), Progress = 60, ProjectId = projects[0].Id },
            new() { Code = "CV003", Title = "Thiết kế giao diện Dashboard", Description = "UI dashboard KPI.", AssigneeId = employees[1].Id, AssignerId = assigner.Id, Priority = TaskPriority.Medium, Status = WorkTaskStatus.Review, StartDate = new DateTime(2025, 2, 1), DueDate = new DateTime(2025, 2, 25), Progress = 80, ProjectId = projects[0].Id },
            new() { Code = "CV004", Title = "Tích hợp thanh toán", Description = "Cổng thanh toán VNPay.", AssigneeId = assignee.Id, AssignerId = employees[1].Id, Priority = TaskPriority.Urgent, Status = WorkTaskStatus.Todo, StartDate = new DateTime(2025, 4, 1), DueDate = new DateTime(2025, 4, 30), Progress = 0, ProjectId = projects[1].Id },
            new() { Code = "CV005", Title = "Viết tài liệu hướng dẫn", Description = "User manual.", AssigneeId = employees[3].Id, AssignerId = assigner.Id, Priority = TaskPriority.Low, Status = WorkTaskStatus.Todo, StartDate = new DateTime(2025, 3, 15), DueDate = new DateTime(2025, 5, 1), Progress = 0, ProjectId = projects[0].Id }
        };
        await context.Tasks.AddRangeAsync(tasks);
        await context.SaveChangesAsync();

        // DA004 - Quy trình xử lý đơn hàng xuất khẩu: 1 task cha + 6 task con theo quy trình thực tế.
        var processStart = projects[3].StartDate;
        var parentTask = new TaskItem
        {
            Code = "CV006",
            Title = "Quy trình xử lý đơn hàng xuất khẩu",
            Description = "Tổng hợp toàn bộ quy trình xử lý 1 đơn hàng xuất khẩu, từ tạo hợp đồng đến giao hàng và hoàn tất hồ sơ.",
            AssigneeId = nv001.Id,
            AssignerId = nv002.Id,
            Priority = TaskPriority.High,
            Status = WorkTaskStatus.InProgress,
            StartDate = processStart,
            DueDate = processStart.AddDays(14),
            Progress = 45,
            ProjectId = projects[3].Id
        };
        await context.Tasks.AddAsync(parentTask);
        await context.SaveChangesAsync();

        var subTasks = new List<TaskItem>
        {
            new()
            {
                Code = "CV007",
                Title = "Tạo công việc/hợp đồng đơn hàng",
                Description = "Phòng kinh doanh tạo công việc ghi tên hợp đồng, khách hàng, sản lượng, yêu cầu khác, gửi cho Logistics, Nhà máy, Kế toán, Ban giám đốc.",
                AssigneeId = nv001.Id,
                AssignerId = nv002.Id,
                Priority = TaskPriority.High,
                Status = WorkTaskStatus.Done,
                StartDate = processStart,
                DueDate = processStart.AddDays(2),
                Progress = 100,
                ProjectId = projects[3].Id,
                ParentTaskId = parentTask.Id
            },
            new()
            {
                Code = "CV008",
                Title = "Liên hệ nhà cung cấp đưa nguyên liệu về sản xuất",
                Description = "Phòng kinh doanh liên hệ nhà cung cấp đưa nguyên liệu về nhà máy.",
                AssigneeId = nv001.Id,
                AssignerId = nv002.Id,
                Priority = TaskPriority.High,
                Status = WorkTaskStatus.Done,
                StartDate = processStart.AddDays(2),
                DueDate = processStart.AddDays(4),
                Progress = 100,
                ProjectId = projects[3].Id,
                ParentTaskId = parentTask.Id
            },
            new()
            {
                Code = "CV009",
                Title = "Sản xuất theo đơn hàng",
                Description = "Nhà máy tiến hành sản xuất theo đơn hàng.",
                AssigneeId = nv003.Id,
                AssignerId = nv001.Id,
                Priority = TaskPriority.High,
                Status = WorkTaskStatus.InProgress,
                StartDate = processStart.AddDays(4),
                DueDate = processStart.AddDays(6),
                Progress = 60,
                ProjectId = projects[3].Id,
                ParentTaskId = parentTask.Id
            },
            new()
            {
                Code = "CV010",
                Title = "Sắp xếp giao hàng và làm hồ sơ xuất khẩu",
                Description = "Logistics liên hệ nhà máy hỏi thời gian giao hàng, đưa cont lấy hàng, làm thủ tục và hồ sơ xuất khẩu.",
                AssigneeId = nv006.Id,
                AssignerId = nv001.Id,
                Priority = TaskPriority.Medium,
                Status = WorkTaskStatus.Todo,
                StartDate = processStart.AddDays(6),
                DueDate = processStart.AddDays(8),
                Progress = 0,
                ProjectId = projects[3].Id,
                ParentTaskId = parentTask.Id
            },
            new()
            {
                Code = "CV011",
                Title = "Xuất hóa đơn",
                Description = "Phòng kế toán xuất hóa đơn cho đơn hàng.",
                AssigneeId = nv005.Id,
                AssignerId = nv001.Id,
                Priority = TaskPriority.Medium,
                Status = WorkTaskStatus.Todo,
                StartDate = processStart.AddDays(8),
                DueDate = processStart.AddDays(10),
                Progress = 0,
                ProjectId = projects[3].Id,
                ParentTaskId = parentTask.Id
            },
            new()
            {
                Code = "CV012",
                Title = "Gửi hồ sơ hoàn thành cho phòng kinh doanh",
                Description = "Logistics gửi hồ sơ cho phòng kinh doanh => hoàn thành đơn hàng.",
                AssigneeId = nv006.Id,
                AssignerId = nv001.Id,
                Priority = TaskPriority.Low,
                Status = WorkTaskStatus.Todo,
                StartDate = processStart.AddDays(10),
                DueDate = processStart.AddDays(12),
                Progress = 0,
                ProjectId = projects[3].Id,
                ParentTaskId = parentTask.Id
            }
        };
        await context.Tasks.AddRangeAsync(subTasks);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Template quy trình hợp đồng đơn hàng xuất khẩu: 1 task gốc + 6 task theo phòng ban.
    /// Nếu DA005 tồn tại với cấu trúc cũ phức tạp (>7 tasks), xóa cứng và tạo lại.
    /// </summary>
    private static async Task SeedExportOrderTemplateAsync(ApplicationDbContext context)
    {
        var existing = await context.Projects
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Code == "DA005");

        if (existing != null)
        {
            var taskCount = await context.Tasks
                .IgnoreQueryFilters()
                .CountAsync(t => t.ProjectId == existing.Id);

            if (taskCount <= 7)
            {
                if (!existing.IsTemplate)
                {
                    existing.IsTemplate = true;
                    await context.SaveChangesAsync();
                }
                return;
            }

            // Xóa cứng theo thứ tự FK để tránh constraint violation
            await context.Database.ExecuteSqlRawAsync(
                "DELETE FROM TaskComments WHERE TaskId IN (SELECT Id FROM Tasks WHERE ProjectId = {0})", existing.Id);
            await context.Database.ExecuteSqlRawAsync(
                "DELETE FROM TaskAttachments WHERE TaskId IN (SELECT Id FROM Tasks WHERE ProjectId = {0})", existing.Id);
            await context.Database.ExecuteSqlRawAsync(
                "DELETE FROM TaskAssignees WHERE TaskId IN (SELECT Id FROM Tasks WHERE ProjectId = {0})", existing.Id);
            await context.Database.ExecuteSqlRawAsync(
                "UPDATE Tasks SET ParentTaskId = NULL WHERE ProjectId = {0}", existing.Id);
            await context.Database.ExecuteSqlRawAsync(
                "DELETE FROM Tasks WHERE ProjectId = {0}", existing.Id);
            await context.Database.ExecuteSqlRawAsync(
                "DELETE FROM ProjectComments WHERE ProjectId = {0}", existing.Id);
            await context.Database.ExecuteSqlRawAsync(
                "DELETE FROM ProjectAttachments WHERE ProjectId = {0}", existing.Id);
            await context.Database.ExecuteSqlRawAsync(
                "DELETE FROM ProjectMembers WHERE ProjectId = {0}", existing.Id);
            await context.Database.ExecuteSqlRawAsync(
                "DELETE FROM Projects WHERE Id = {0}", existing.Id);
        }

        var employees = await context.Employees.OrderBy(e => e.EmployeeCode).ToListAsync();
        if (employees.Count < 6) return;

        var nv001 = employees.First(e => e.EmployeeCode == "NV001"); // Kinh doanh
        var nv002 = employees.First(e => e.EmployeeCode == "NV002"); // Ban giám đốc
        var nv003 = employees.First(e => e.EmployeeCode == "NV003"); // Sản xuất / QA-QC
        var nv005 = employees.First(e => e.EmployeeCode == "NV005"); // Kế toán
        var nv006 = employees.First(e => e.EmployeeCode == "NV006"); // Logistics
        var nv007 = employees.First(e => e.EmployeeCode == "NV007"); // Kho

        // Ngày tham chiếu: D0 = ngày nhận inquiry, toàn bộ chu trình 21 ngày làm việc.
        var d0 = new DateTime(2026, 7, 1);

        var project = new Project
        {
            Code = "DA005",
            Name = "[MẪU] Hợp đồng Đơn hàng Xuất khẩu Gia vị Hồ tiêu",
            Investor = "SAIGON SPICES",
            StartDate = d0,
            EndDate = d0.AddDays(21),
            ShippingDate = d0.AddDays(17),
            Status = ProjectStatus.Planning,
            Budget = 0,
            Progress = 0,
            IsTemplate = true,
            Description = "Template quy trình chuẩn xử lý 1 đơn hàng xuất khẩu gia vị hồ tiêu xuyên 5 phòng ban: Kinh doanh → Kho/Sản xuất/QA-QC → Logistics → Kế toán → Ban giám đốc. " +
                          "Sao chép template này để tạo dự án thực tế cho mỗi đơn hàng mới."
        };
        await context.Projects.AddAsync(project);
        await context.SaveChangesAsync();

        // Thành viên dự án - đại diện các phòng ban liên quan.
        project.Members.Add(new ProjectMember { EmployeeId = nv001.Id, RoleInProject = "Process Owner – Kinh doanh", JoinedDate = d0 });
        project.Members.Add(new ProjectMember { EmployeeId = nv002.Id, RoleInProject = "Phê duyệt – Ban Giám đốc", JoinedDate = d0 });
        project.Members.Add(new ProjectMember { EmployeeId = nv003.Id, RoleInProject = "Sản xuất & QA-QC", JoinedDate = d0 });
        project.Members.Add(new ProjectMember { EmployeeId = nv005.Id, RoleInProject = "Kế toán – Hóa đơn & Hoàn thuế", JoinedDate = d0 });
        project.Members.Add(new ProjectMember { EmployeeId = nv006.Id, RoleInProject = "Logistics – Thủ tục XK & Giao hàng", JoinedDate = d0 });
        project.Members.Add(new ProjectMember { EmployeeId = nv007.Id, RoleInProject = "Kho – Nguyên liệu & Thành phẩm", JoinedDate = d0 });
        await context.SaveChangesAsync();

        // ─── Task gốc (root) ───────────────────────────────────────────────────────
        var root = new TaskItem
        {
            Code = "TXK-P00",
            Title = "Quy trình Hợp đồng Đơn hàng Xuất khẩu (End-to-End)",
            Description = "Task cha tổng hợp toàn bộ quy trình từ tiếp nhận inquiry đến hoàn tất thanh toán. " +
                          "Mỗi phòng ban phụ trách 1 công việc theo thứ tự quy trình.",
            AssigneeId = nv001.Id, AssignerId = nv002.Id,
            Priority = TaskPriority.High, Status = WorkTaskStatus.Todo,
            StartDate = d0, DueDate = d0.AddDays(21), Progress = 0,
            ProjectId = project.Id
        };
        await context.Tasks.AddAsync(root);
        await context.SaveChangesAsync();

        // ─── 6 task theo phòng ban (phẳng, gắn trực tiếp vào root) ───────────────
        var subtasks = new List<TaskItem>
        {
            new()
            {
                Code = "TXK-01",
                Title = "Phòng Kinh doanh – Đàm phán, ký hợp đồng & phát lệnh sản xuất",
                Description = "Tiếp nhận inquiry từ khách hàng nước ngoài. Báo giá FOB/CIF. " +
                              "Đàm phán và thống nhất điều khoản (giá, số lượng, Incoterms, thanh toán, tiêu chuẩn CL). " +
                              "Trình BGĐ phê duyệt, ký Sales Contract. " +
                              "Phát Lệnh sản xuất nội bộ cho Kho, Sản xuất, Logistics.",
                AssigneeId = nv001.Id, AssignerId = nv002.Id,
                Priority = TaskPriority.Urgent, Status = WorkTaskStatus.Todo,
                StartDate = d0, DueDate = d0.AddDays(3), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            },
            new()
            {
                Code = "TXK-02",
                Title = "Ban Giám đốc – Phê duyệt hợp đồng xuất khẩu",
                Description = "Review Sales Contract: giá bán, biên lợi nhuận, điều kiện L/C và rủi ro thanh toán. " +
                              "Phê duyệt → chuyển bước ký chính thức. Từ chối → yêu cầu Kinh doanh đàm phán lại.",
                AssigneeId = nv002.Id, AssignerId = nv002.Id,
                Priority = TaskPriority.High, Status = WorkTaskStatus.Todo,
                StartDate = d0.AddDays(2), DueDate = d0.AddDays(3), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            },
            new()
            {
                Code = "TXK-03",
                Title = "Kho – Kiểm tra tồn kho & chuẩn bị nguyên liệu",
                Description = "Kiểm tra thực tế số lượng hồ tiêu thô tồn kho (đen/trắng, lô hàng, độ ẩm). " +
                              "Lập Phiếu kiểm kho gửi Kinh doanh và Sản xuất. " +
                              "Nhận nguyên liệu mua thêm (nếu có). Sau khi sản xuất xong: nhập kho thành phẩm, " +
                              "sắp xếp hàng vào khu vực chờ xuất (staging area).",
                AssigneeId = nv007.Id, AssignerId = nv001.Id,
                Priority = TaskPriority.High, Status = WorkTaskStatus.Todo,
                StartDate = d0.AddDays(3), DueDate = d0.AddDays(5), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            },
            new()
            {
                Code = "TXK-04",
                Title = "Sản xuất / QA-QC – Sản xuất, đóng gói & kiểm định chất lượng",
                Description = "Kiểm tra CL nguyên liệu đầu vào (độ ẩm, tạp chất, aflatoxin). " +
                              "Chế biến hồ tiêu theo tiêu chuẩn xuất khẩu (EU/ASTA/ESA). " +
                              "Đóng gói theo quy cách hợp đồng (bao PP/kraft, nhãn hiệu khách, số lô). " +
                              "Kiểm tra CL thành phẩm và cấp Certificate of Analysis (CoA). Gửi CoA cho Logistics.",
                AssigneeId = nv003.Id, AssignerId = nv001.Id,
                Priority = TaskPriority.High, Status = WorkTaskStatus.Todo,
                StartDate = d0.AddDays(5), DueDate = d0.AddDays(12), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            },
            new()
            {
                Code = "TXK-05",
                Title = "Phòng Logistics – Hồ sơ xuất khẩu, thông quan & giao hàng lên tàu",
                Description = "Lập Commercial Invoice & Packing List. " +
                              "Đăng ký kiểm dịch thực vật (Phytosanitary Certificate). " +
                              "Xin C/O (Form A/B/EUR.1 tùy thị trường). Booking container & đặt lịch tàu. " +
                              "Khai báo hải quan điện tử VNACCS. Vận chuyển hàng đến cảng, đóng container. " +
                              "Giao hàng lên tàu, nhận B/L gốc. Gửi bộ chứng từ gốc cho khách (DHL/Swift).",
                AssigneeId = nv006.Id, AssignerId = nv001.Id,
                Priority = TaskPriority.Urgent, Status = WorkTaskStatus.Todo,
                StartDate = d0.AddDays(10), DueDate = d0.AddDays(17), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            },
            new()
            {
                Code = "TXK-06",
                Title = "Phòng Kế toán – Xuất hóa đơn, theo dõi thanh toán & hoàn thuế VAT",
                Description = "Xuất Hóa đơn GTGT điện tử (thuế suất 0% xuất khẩu) sau khi hàng thông quan. " +
                              "Theo dõi thanh toán từ khách hàng (T/T hoặc L/C); nhắc công nợ nếu trễ hạn. " +
                              "Chuẩn bị và nộp hồ sơ hoàn thuế VAT xuất khẩu tại cơ quan thuế. " +
                              "Hạch toán doanh thu và khoản hoàn thuế vào sổ kế toán.",
                AssigneeId = nv005.Id, AssignerId = nv001.Id,
                Priority = TaskPriority.High, Status = WorkTaskStatus.Todo,
                StartDate = d0.AddDays(17), DueDate = d0.AddDays(21), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            }
        };

        await context.Tasks.AddRangeAsync(subtasks);
        await context.SaveChangesAsync();
    }

    private static async Task SeedDomesticOrderTemplateAsync(ApplicationDbContext context)
    {
        if (await context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Code == "DA006")) return;

        var employees = await context.Employees.IgnoreQueryFilters().OrderBy(e => e.EmployeeCode).ToListAsync();
        if (employees.Count < 7) return;

        var nv001 = employees.First(e => e.EmployeeCode == "NV001");
        var nv005 = employees.First(e => e.EmployeeCode == "NV005");
        var nv006 = employees.First(e => e.EmployeeCode == "NV006");
        var nv007 = employees.First(e => e.EmployeeCode == "NV007");

        var d0 = new DateTime(2026, 8, 1);

        var project = new Project
        {
            Code = "DA006",
            Name = "[MẪU] Quy trình Xử lý Đơn hàng Nội địa (Nhà hàng – Khách sạn)",
            Investor = "SAIGON SPICES",
            StartDate = d0,
            EndDate = d0.AddDays(7),
            Status = ProjectStatus.Planning,
            Budget = 0,
            Progress = 0,
            IsTemplate = true,
            Description = "Template quy trình chuẩn xử lý đơn hàng B2B nội địa (nhà hàng, khách sạn): " +
                          "Kinh doanh tiếp nhận → Kho xuất hàng → Logistics giao hàng → Kế toán thu tiền. Chu trình 7 ngày."
        };
        await context.Projects.AddAsync(project);
        await context.SaveChangesAsync();

        project.Members.Add(new ProjectMember { EmployeeId = nv001.Id, RoleInProject = "Kinh doanh – Tiếp nhận & Báo giá", JoinedDate = d0 });
        project.Members.Add(new ProjectMember { EmployeeId = nv007.Id, RoleInProject = "Kho – Xuất kho & Bàn giao", JoinedDate = d0 });
        project.Members.Add(new ProjectMember { EmployeeId = nv006.Id, RoleInProject = "Logistics – Giao hàng", JoinedDate = d0 });
        project.Members.Add(new ProjectMember { EmployeeId = nv005.Id, RoleInProject = "Kế toán – Hóa đơn & Thu tiền", JoinedDate = d0 });
        await context.SaveChangesAsync();

        var root = new TaskItem
        {
            Code = "TND-P0",
            Title = "Quy trình Đơn hàng Nội địa (End-to-End)",
            Description = "Task gốc tổng hợp toàn bộ quy trình từ tiếp nhận đơn hàng đến thu tiền. " +
                          "4 bộ phận phụ trách 4 bước tuần tự trong vòng 7 ngày.",
            AssigneeId = nv001.Id, AssignerId = nv001.Id,
            Priority = TaskPriority.Medium, Status = WorkTaskStatus.Todo,
            StartDate = d0, DueDate = d0.AddDays(7), Progress = 0,
            ProjectId = project.Id
        };
        await context.Tasks.AddAsync(root);
        await context.SaveChangesAsync();

        var subtasks = new List<TaskItem>
        {
            new()
            {
                Code = "TND-01",
                Title = "Kinh doanh – Tiếp nhận đơn hàng & xác nhận báo giá",
                Description = "Tiếp nhận đơn đặt hàng từ nhà hàng/khách sạn (điện thoại, email, app). " +
                              "Kiểm tra khả năng đáp ứng tồn kho. Gửi báo giá và xác nhận đơn hàng chính thức. " +
                              "Phát lệnh cho Kho chuẩn bị hàng.",
                AssigneeId = nv001.Id, AssignerId = nv001.Id,
                Priority = TaskPriority.High, Status = WorkTaskStatus.Todo,
                StartDate = d0, DueDate = d0.AddDays(1), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            },
            new()
            {
                Code = "TND-02",
                Title = "Kho – Chuẩn bị hàng & xuất kho",
                Description = "Nhận lệnh xuất kho từ Kinh doanh. Kiểm tra tồn kho thực tế, xuất hàng theo đúng " +
                              "chủng loại, số lượng và quy cách đóng gói yêu cầu. Lập Phiếu xuất kho và bàn giao cho Logistics.",
                AssigneeId = nv007.Id, AssignerId = nv001.Id,
                Priority = TaskPriority.High, Status = WorkTaskStatus.Todo,
                StartDate = d0.AddDays(1), DueDate = d0.AddDays(3), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            },
            new()
            {
                Code = "TND-03",
                Title = "Logistics – Đóng gói & giao hàng đến khách",
                Description = "Nhận hàng từ Kho. Đóng gói theo tiêu chuẩn thương hiệu (nhãn, thùng carton). " +
                              "Lên lịch và thực hiện giao hàng đến địa điểm của khách hàng. " +
                              "Yêu cầu khách ký Biên bản giao nhận. Gửi biên bản về Kế toán.",
                AssigneeId = nv006.Id, AssignerId = nv001.Id,
                Priority = TaskPriority.High, Status = WorkTaskStatus.Todo,
                StartDate = d0.AddDays(3), DueDate = d0.AddDays(5), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            },
            new()
            {
                Code = "TND-04",
                Title = "Kế toán – Xuất hóa đơn & theo dõi thu tiền",
                Description = "Xuất Hóa đơn GTGT điện tử sau khi có biên bản giao nhận. " +
                              "Theo dõi công nợ, nhắc thanh toán đúng hạn. " +
                              "Hạch toán doanh thu khi tiền về tài khoản. Lưu chứng từ đầy đủ.",
                AssigneeId = nv005.Id, AssignerId = nv001.Id,
                Priority = TaskPriority.Medium, Status = WorkTaskStatus.Todo,
                StartDate = d0.AddDays(5), DueDate = d0.AddDays(7), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            }
        };

        await context.Tasks.AddRangeAsync(subtasks);
        await context.SaveChangesAsync();
    }

    private static async Task SeedProcurementTemplateAsync(ApplicationDbContext context)
    {
        if (await context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Code == "DA007")) return;

        var employees = await context.Employees.IgnoreQueryFilters().OrderBy(e => e.EmployeeCode).ToListAsync();
        if (employees.Count < 7) return;

        var nv001 = employees.First(e => e.EmployeeCode == "NV001");
        var nv002 = employees.First(e => e.EmployeeCode == "NV002");
        var nv003 = employees.First(e => e.EmployeeCode == "NV003");
        var nv005 = employees.First(e => e.EmployeeCode == "NV005");
        var nv007 = employees.First(e => e.EmployeeCode == "NV007");

        var d0 = new DateTime(2026, 9, 1);

        var project = new Project
        {
            Code = "DA007",
            Name = "[MẪU] Quy trình Thu mua Nguyên liệu Hồ tiêu",
            Investor = "SAIGON SPICES",
            StartDate = d0,
            EndDate = d0.AddDays(14),
            Status = ProjectStatus.Planning,
            Budget = 0,
            Progress = 0,
            IsTemplate = true,
            Description = "Template quy trình chuẩn thu mua nguyên liệu hồ tiêu từ nhà cung cấp: " +
                          "Kinh doanh tìm NCC → BGĐ phê duyệt → Kho tiếp nhận → QA-QC kiểm định → Kế toán thanh toán. Chu trình 14 ngày."
        };
        await context.Projects.AddAsync(project);
        await context.SaveChangesAsync();

        project.Members.Add(new ProjectMember { EmployeeId = nv001.Id, RoleInProject = "Kinh doanh – Tìm kiếm & Đánh giá NCC", JoinedDate = d0 });
        project.Members.Add(new ProjectMember { EmployeeId = nv002.Id, RoleInProject = "Ban Giám đốc – Phê duyệt", JoinedDate = d0 });
        project.Members.Add(new ProjectMember { EmployeeId = nv003.Id, RoleInProject = "Sản xuất / QA-QC – Kiểm định", JoinedDate = d0 });
        project.Members.Add(new ProjectMember { EmployeeId = nv005.Id, RoleInProject = "Kế toán – Thanh toán & Chứng từ", JoinedDate = d0 });
        project.Members.Add(new ProjectMember { EmployeeId = nv007.Id, RoleInProject = "Kho – Tiếp nhận & Kiểm đếm", JoinedDate = d0 });
        await context.SaveChangesAsync();

        var root = new TaskItem
        {
            Code = "TMN-P0",
            Title = "Quy trình Thu mua Nguyên liệu (End-to-End)",
            Description = "Task gốc tổng hợp toàn bộ quy trình thu mua từ tìm kiếm nhà cung cấp đến thanh toán. " +
                          "5 bộ phận phụ trách 5 bước, tổng thời gian 14 ngày.",
            AssigneeId = nv001.Id, AssignerId = nv002.Id,
            Priority = TaskPriority.High, Status = WorkTaskStatus.Todo,
            StartDate = d0, DueDate = d0.AddDays(14), Progress = 0,
            ProjectId = project.Id
        };
        await context.Tasks.AddAsync(root);
        await context.SaveChangesAsync();

        var subtasks = new List<TaskItem>
        {
            new()
            {
                Code = "TMN-01",
                Title = "Kinh doanh – Tìm kiếm & đánh giá nhà cung cấp",
                Description = "Rà soát danh sách nhà cung cấp hiện tại và tiềm năng. Yêu cầu báo giá (RFQ). " +
                              "Đánh giá theo tiêu chí: giá cả, chất lượng mẫu, chứng chỉ (VietGAP/hữu cơ), " +
                              "điều kiện thanh toán và năng lực cung ứng. Lập Tờ trình đề xuất NCC trình BGĐ.",
                AssigneeId = nv001.Id, AssignerId = nv002.Id,
                Priority = TaskPriority.High, Status = WorkTaskStatus.Todo,
                StartDate = d0, DueDate = d0.AddDays(3), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            },
            new()
            {
                Code = "TMN-02",
                Title = "Ban Giám đốc – Phê duyệt nhà cung cấp & phát lệnh đặt hàng",
                Description = "Review Tờ trình đề xuất NCC. Phê duyệt NCC được chọn và ngân sách mua hàng. " +
                              "Ký Hợp đồng mua hàng hoặc Đơn đặt hàng (PO). " +
                              "Thông báo quyết định cho Kinh doanh để phát lệnh thu mua chính thức.",
                AssigneeId = nv002.Id, AssignerId = nv002.Id,
                Priority = TaskPriority.Urgent, Status = WorkTaskStatus.Todo,
                StartDate = d0.AddDays(2), DueDate = d0.AddDays(3), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            },
            new()
            {
                Code = "TMN-03",
                Title = "Kho – Tiếp nhận & kiểm đếm hàng hóa",
                Description = "Chuẩn bị khu vực tiếp nhận. Nhận hàng từ NCC, đối chiếu số lượng với PO. " +
                              "Kiểm tra bao bì, nhãn mác, ngày sản xuất, lô hàng. " +
                              "Lập Phiếu nhập kho và gửi mẫu hàng cho QA-QC kiểm định. " +
                              "Cách ly hàng chờ kết quả kiểm định trước khi nhập kho chính thức.",
                AssigneeId = nv007.Id, AssignerId = nv001.Id,
                Priority = TaskPriority.High, Status = WorkTaskStatus.Todo,
                StartDate = d0.AddDays(3), DueDate = d0.AddDays(7), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            },
            new()
            {
                Code = "TMN-04",
                Title = "Sản xuất / QA-QC – Kiểm định chất lượng nguyên liệu",
                Description = "Lấy mẫu ngẫu nhiên theo tiêu chuẩn (TCVN/ISO). " +
                              "Kiểm tra: độ ẩm, hàm lượng tinh dầu, tỷ lệ tạp chất, aflatoxin, dư lượng thuốc BVTV. " +
                              "Đạt tiêu chuẩn → Cấp phép nhập kho chính thức. " +
                              "Không đạt → Yêu cầu NCC đổi hàng hoặc giảm giá.",
                AssigneeId = nv003.Id, AssignerId = nv001.Id,
                Priority = TaskPriority.High, Status = WorkTaskStatus.Todo,
                StartDate = d0.AddDays(5), DueDate = d0.AddDays(10), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            },
            new()
            {
                Code = "TMN-05",
                Title = "Kế toán – Thanh toán nhà cung cấp & lưu chứng từ",
                Description = "Nhận bộ chứng từ từ NCC (hóa đơn, phiếu xuất kho NCC, biên bản giao nhận). " +
                              "Đối chiếu với PO và biên bản kiểm định QA-QC. " +
                              "Thực hiện thanh toán đúng hạn theo điều khoản hợp đồng. " +
                              "Hạch toán giá trị hàng nhập kho vào sổ kế toán. Lưu toàn bộ chứng từ.",
                AssigneeId = nv005.Id, AssignerId = nv001.Id,
                Priority = TaskPriority.Medium, Status = WorkTaskStatus.Todo,
                StartDate = d0.AddDays(10), DueDate = d0.AddDays(14), Progress = 0,
                ProjectId = project.Id, ParentTaskId = root.Id
            }
        };

        await context.Tasks.AddRangeAsync(subtasks);
        await context.SaveChangesAsync();
    }

    private static async Task SeedDepartmentsAndEmployeesAsync(ApplicationDbContext context)
    {
        if (await context.Departments.AnyAsync())
        {
            return;
        }

        // Cấp 1: 2 khối chính theo sơ đồ tổ chức công ty.
        var topLevelDepartments = new List<Department>
        {
            new() { Name = "Văn phòng", Description = "Khối văn phòng - điều hành, kinh doanh, hỗ trợ", Icon = "building-2", ColorVariant = "primary" },
            new() { Name = "Nhà máy", Description = "Khối sản xuất - nhà máy chế biến", Icon = "factory", ColorVariant = "success" }
        };
        await context.Departments.AddRangeAsync(topLevelDepartments);
        await context.SaveChangesAsync();

        var vanPhong = topLevelDepartments[0];
        var nhaMay = topLevelDepartments[1];

        // Cấp 2: các phòng/ban trực thuộc Văn phòng và Nhà máy.
        var childDepartments = new List<Department>
        {
            new() { Name = "Ban giám đốc", Description = "Điều hành chung toàn công ty", Icon = "shield-check", ColorVariant = "primary", ParentDepartmentId = vanPhong.Id },
            new() { Name = "Phòng Kinh doanh", Description = "Kinh doanh, chăm sóc khách hàng, hợp đồng", Icon = "briefcase", ColorVariant = "success", ParentDepartmentId = vanPhong.Id },
            new() { Name = "Phòng Kế toán", Description = "Tài chính, kế toán, hóa đơn", Icon = "calculator", ColorVariant = "warning", ParentDepartmentId = vanPhong.Id },
            new() { Name = "Phòng HCNS-Tổng hợp", Description = "Hành chính, nhân sự và tổng hợp", Icon = "users", ColorVariant = "primary", ParentDepartmentId = vanPhong.Id },
            new() { Name = "Phòng Logistics", Description = "Vận chuyển, xuất nhập khẩu, thủ tục hải quan", Icon = "truck", ColorVariant = "warning", ParentDepartmentId = vanPhong.Id },
            new() { Name = "Ban giám đốc Nhà máy", Description = "Điều hành sản xuất tại nhà máy", Icon = "shield-check", ColorVariant = "primary", ParentDepartmentId = nhaMay.Id },
            new() { Name = "Kho - Tổng hợp", Description = "Quản lý kho nguyên liệu và hàng hóa", Icon = "warehouse", ColorVariant = "success", ParentDepartmentId = nhaMay.Id },
            new() { Name = "QA-QC", Description = "Kiểm soát và đảm bảo chất lượng", Icon = "shield-check", ColorVariant = "destructive", ParentDepartmentId = nhaMay.Id },
            new() { Name = "Sản xuất", Description = "Sản xuất, chế biến gia vị hồ tiêu", Icon = "cog", ColorVariant = "success", ParentDepartmentId = nhaMay.Id }
        };
        await context.Departments.AddRangeAsync(childDepartments);
        await context.SaveChangesAsync();

        var banGiamDoc = childDepartments[0];
        var phongKinhDoanh = childDepartments[1];
        var phongKeToan = childDepartments[2];
        var phongHcns = childDepartments[3];
        var phongLogistics = childDepartments[4];
        var khoTongHop = childDepartments[6];
        var sanXuat = childDepartments[8];

        var employees = new List<Employee>
        {
            new() { EmployeeCode = "NV001", FullName = "Nguyễn Văn An", DateOfBirth = new DateTime(1990, 5, 12), Gender = Gender.Male, IdCardNumber = "012345678901", PhoneNumber = "0901234567", Email = "an.nguyen@workforce.local", Address = "Hà Nội", DepartmentId = phongKinhDoanh.Id, Position = "Trưởng phòng Kinh doanh", HireDate = new DateTime(2018, 3, 1), Status = EmployeeStatus.Active },
            new() { EmployeeCode = "NV002", FullName = "Trần Thị Bình", DateOfBirth = new DateTime(1992, 8, 20), Gender = Gender.Female, IdCardNumber = "012345678902", PhoneNumber = "0901234568", Email = "binh.tran@workforce.local", Address = "Hồ Chí Minh", DepartmentId = banGiamDoc.Id, Position = "Phó Giám đốc", HireDate = new DateTime(2019, 6, 15), Status = EmployeeStatus.Active },
            new() { EmployeeCode = "NV003", FullName = "Lê Văn Cường", DateOfBirth = new DateTime(1995, 1, 5), Gender = Gender.Male, IdCardNumber = "012345678903", PhoneNumber = "0901234569", Email = "cuong.le@workforce.local", Address = "Đà Nẵng", DepartmentId = sanXuat.Id, Position = "Nhân viên Sản xuất", HireDate = new DateTime(2021, 2, 10), Status = EmployeeStatus.Active },
            new() { EmployeeCode = "NV004", FullName = "Phạm Thị Dung", DateOfBirth = new DateTime(1993, 11, 30), Gender = Gender.Female, IdCardNumber = "012345678904", PhoneNumber = "0901234570", Email = "dung.pham@workforce.local", Address = "Hà Nội", DepartmentId = phongHcns.Id, Position = "Chuyên viên Nhân sự", HireDate = new DateTime(2020, 9, 1), Status = EmployeeStatus.Active },
            new() { EmployeeCode = "NV005", FullName = "Hoàng Văn Em", DateOfBirth = new DateTime(1988, 7, 18), Gender = Gender.Male, IdCardNumber = "012345678905", PhoneNumber = "0901234571", Email = "em.hoang@workforce.local", Address = "Hồ Chí Minh", DepartmentId = phongKeToan.Id, Position = "Kế toán trưởng", HireDate = new DateTime(2017, 4, 20), Status = EmployeeStatus.Active },
            new() { EmployeeCode = "NV006", FullName = "Ngô Thị Phương", DateOfBirth = new DateTime(1994, 3, 22), Gender = Gender.Female, IdCardNumber = "012345678906", PhoneNumber = "0901234572", Email = "phuong.ngo@workforce.local", Address = "TP. Hồ Chí Minh", DepartmentId = phongLogistics.Id, Position = "Nhân viên Logistics", HireDate = new DateTime(2022, 5, 3), Status = EmployeeStatus.Active },
            new() { EmployeeCode = "NV007", FullName = "Đặng Văn Giang", DateOfBirth = new DateTime(1991, 10, 9), Gender = Gender.Male, IdCardNumber = "012345678907", PhoneNumber = "0901234573", Email = "giang.dang@workforce.local", Address = "Bình Dương", DepartmentId = khoTongHop.Id, Position = "Nhân viên Kho", HireDate = new DateTime(2021, 8, 16), Status = EmployeeStatus.Active }
        };
        await context.Employees.AddRangeAsync(employees);
        await context.SaveChangesAsync();

        // Gán trưởng phòng.
        banGiamDoc.ManagerId = employees[1].Id;
        phongKinhDoanh.ManagerId = employees[0].Id;
        phongKeToan.ManagerId = employees[4].Id;
        phongHcns.ManagerId = employees[3].Id;
        await context.SaveChangesAsync();
    }

    private static async Task SeedUsersAsync(ApplicationDbContext context, IPasswordHasher hasher)
    {
        // Link admin → NV001 nếu chưa có EmployeeId (chạy mỗi lần startup để fix DB cũ).
        var existingAdmin = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        if (existingAdmin != null && existingAdmin.EmployeeId == null)
        {
            var adminEmployee = await context.Employees.FirstOrDefaultAsync(e => e.EmployeeCode == "NV001");
            if (adminEmployee != null)
            {
                existingAdmin.EmployeeId = adminEmployee.Id;
                await context.SaveChangesAsync();
            }
        }

        if (await context.Users.AnyAsync())
        {
            return;
        }

        var adminEmp = await context.Employees
            .FirstOrDefaultAsync(e => e.EmployeeCode == "NV001");
        var managerEmployee = await context.Employees
            .FirstOrDefaultAsync(e => e.EmployeeCode == "NV002");
        var staffEmployee = await context.Employees
            .FirstOrDefaultAsync(e => e.EmployeeCode == "NV003");

        var users = new List<User>
        {
            new()
            {
                Username = "admin",
                Email = "admin@workforce.local",
                PasswordHash = hasher.Hash("Admin@123"),
                Role = UserRole.SuperAdmin,
                IsActive = true,
                EmployeeId = adminEmp?.Id
            },
            new()
            {
                Username = "manager",
                Email = "manager@workforce.local",
                PasswordHash = hasher.Hash("Manager@123"),
                Role = UserRole.Manager,
                IsActive = true,
                EmployeeId = managerEmployee?.Id
            },
            new()
            {
                Username = "employee",
                Email = "employee@workforce.local",
                PasswordHash = hasher.Hash("Employee@123"),
                Role = UserRole.Employee,
                IsActive = true,
                EmployeeId = staffEmployee?.Id
            }
        };

        await context.Users.AddRangeAsync(users);
        await context.SaveChangesAsync();
    }
}
