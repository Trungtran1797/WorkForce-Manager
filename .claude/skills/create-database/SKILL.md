---
name: create-database
description: Thêm một entity mới vào DbContext của WorkForce Manager - định nghĩa entity (Domain), Fluent API configuration, migration, và seed data nếu cần, áp dụng đúng base entity (audit/soft delete). Dùng khi cần thêm bảng mới hoặc thay đổi schema entity hiện có.
---

# Create Database Entity (EF Core Code First)

Tuân theo `.claude/rules/database-rules.md`.

## Bước 1 - Định nghĩa Entity (Domain)

```csharp
// backend/src/WorkForceManager.Domain/Entities/<Entity>.cs
public class <Entity> : BaseAuditableEntity
{
    public string Code { get; set; } = string.Empty;       // vd. EmployeeCode, ProjectCode
    public string Name { get; set; } = string.Empty;
    // ... các field theo spec module trong CLAUDE.md

    // Navigation properties
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }
}
```

- Tên class `PascalCase`, số ít. Field khớp tên trong `CLAUDE.md` (dịch sang tiếng Anh PascalCase, vd. "Mã nhân viên" → `EmployeeCode`).
- Enum trạng thái đặt trong `Domain/Enums/`.

## Bước 2 - Fluent API Configuration (Infrastructure)

```csharp
// backend/src/WorkForceManager.Infrastructure/Persistence/Configurations/<Entity>Configuration.cs
public class <Entity>Configuration : IEntityTypeConfiguration<<Entity>>
{
    public void Configure(EntityTypeBuilder<<Entity>> builder)
    {
        builder.ToTable("<Entities>");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).IsRequired().HasMaxLength(50);
        builder.HasIndex(x => x.Code).IsUnique();

        builder.HasOne(x => x.Department)
            .WithMany()
            .HasForeignKey(x => x.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
```

- Mọi entity kế thừa `BaseAuditableEntity` phải có `HasQueryFilter(x => !x.IsDeleted)`.
- Enum: `builder.Property(x => x.Status).HasConversion<string>();`
- Index cho field tìm kiếm/unique (Code, Email...).

## Bước 3 - Đăng ký vào DbContext

```csharp
public DbSet<<Entity>> <Entities> => Set<<Entity>>();
```

Configuration tự động apply qua `ApplyConfigurationsFromAssembly` trong `OnModelCreating`.

## Bước 4 - Migration

```bash
cd backend/src/WorkForceManager.Infrastructure
dotnet ef migrations add Add<Entity>Table -s ../WorkForceManager.WebApi -o Persistence/Migrations
dotnet ef database update -s ../WorkForceManager.WebApi
```

## Bước 5 - Seed Data (nếu cần)

- Dữ liệu tĩnh (enum lookup, role mặc định): dùng `builder.HasData(...)` trong Configuration với `Id` cố định.
- Dữ liệu mẫu cho dev: thêm vào `Infrastructure/Persistence/Seed/ApplicationDbContextSeed.cs`, chạy có điều kiện (chỉ khi bảng rỗng, chỉ ở Development).

## Kiểm tra cuối

- `dotnet ef migrations add` không báo lỗi pending model changes.
- `dotnet ef database update` chạy thành công trên SQL Server local.
- Soft delete: xóa 1 record qua repository → record vẫn còn trong DB với `IsDeleted = true`, nhưng query thường không trả về nó.
