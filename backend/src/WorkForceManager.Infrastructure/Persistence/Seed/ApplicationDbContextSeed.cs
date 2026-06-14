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

            await context.Database.MigrateAsync();
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
        await SeedShiftsAndLocationsAsync(context);
        await SeedPayrollAsync(context);
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
        if (await context.Projects.AnyAsync())
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
        if (await context.Users.AnyAsync())
        {
            return;
        }

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
                IsActive = true
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
