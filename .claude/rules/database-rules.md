# Database Rules (SQL Server + EF Core Code First)

## Code First & Migrations

- Toàn bộ schema định nghĩa qua Entity classes (`Domain`) + Fluent API configuration (`Infrastructure/Persistence/Configurations/<Entity>Configuration.cs`, implement `IEntityTypeConfiguration<T>`).
- Không sửa migration đã apply vào DB chung - luôn tạo migration mới (`dotnet ef migrations add <Name>`).
- Mỗi migration phải có tên mô tả rõ thay đổi (vd. `AddLeaveRequestTable`, `AddSoftDeleteToEmployee`).
- Seed data (roles, departments mẫu, admin user) đặt trong `Infrastructure/Persistence/Seed/` và gọi khi `Database.Migrate()` ở startup (môi trường Development) hoặc qua `HasData()` trong configuration cho dữ liệu tĩnh (vd. enum lookup tables).

## Naming Convention

- Tên Entity (class): `PascalCase`, số ít (vd. `Employee`, `Project`, `TaskItem`).
- Tên bảng: mặc định theo tên Entity số nhiều do EF Core convention, hoặc cấu hình rõ qua `.ToTable("Employees")`.
- Tên cột: `PascalCase` khớp tên property C#.
- Khóa ngoại: `<TenEntityLienQuan>Id` (vd. `DepartmentId`, `ProjectId`, `AssignedToId`).
- Enum lưu dạng `string` (qua `HasConversion<string>()`) để dễ đọc trong DB (vd. trạng thái Task: `Todo/InProgress/Review/Done/Cancelled`).

## Chuẩn hóa dữ liệu

- Tuân theo 3NF: không lặp dữ liệu (vd. tên phòng ban chỉ lưu ở bảng `Departments`, `Employee` chỉ lưu `DepartmentId`).
- Bảng nhiều-nhiều (vd. nhân sự ↔ dự án) dùng bảng join riêng (`ProjectMembers`) có thể có thêm field (vai trò trong dự án, ngày tham gia).

## Base Entity - Soft Delete & Audit Log

Mọi entity kế thừa `BaseAuditableEntity` (Domain) gồm:

```csharp
public abstract class BaseAuditableEntity
{
    public int Id { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public string? ModifiedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedDate { get; set; }
    public string? DeletedBy { get; set; }
}
```

- **Soft Delete**: không `DELETE` thật - set `IsDeleted = true`, `DeletedDate`, `DeletedBy`. Áp dụng **global query filter** (`HasQueryFilter(e => !e.IsDeleted)`) trong `OnModelCreating` cho mọi entity kế thừa `BaseAuditableEntity`.
- **Audit Log**: `CreatedDate/CreatedBy` set khi tạo, `ModifiedDate/ModifiedBy` set khi update - tự động hóa qua `SaveChangesInterceptor` (Infrastructure) lấy `CreatedBy/ModifiedBy` từ `ICurrentUserService`.
- Với các thay đổi quan trọng (vd. duyệt nghỉ phép, đổi trạng thái dự án), ghi thêm vào bảng `AuditLogs` riêng (Entity, EntityId, Action, OldValue, NewValue, ChangedBy, ChangedDate) để phục vụ báo cáo/audit trail.

## Indexing & Performance

- Đánh index cho các cột thường filter/sort: `Email` (unique), `EmployeeCode` (unique), khóa ngoại (`DepartmentId`, `ProjectId`, `AssignedToId`), `Status`.
- Dùng `AsNoTracking()` cho mọi query read-only.
- Với danh sách lớn (Employee, Task...), luôn áp dụng pagination ở Application layer (xem [`api-rules.md`](./api-rules.md)).

## Khi thêm entity mới

Tham khảo skill [`create-database`](../skills/create-database/SKILL.md).
