# Clean Architecture & CQRS Rules (Backend)

## Layering (dependency direction: ngoài → trong)

```
WorkForceManager.WebApi          (Controllers, Middleware, DI bootstrap)
        ↓ depends on
WorkForceManager.Infrastructure  (EF Core, Repositories, External Services)
        ↓ depends on
WorkForceManager.Application     (CQRS Commands/Queries, Handlers, DTOs, Interfaces)
        ↓ depends on
WorkForceManager.Domain          (Entities, Enums, Value Objects, Domain Interfaces)
```

- `Domain` không phụ thuộc bất kỳ project nào khác (không reference EF Core, ASP.NET).
- `Application` định nghĩa **interface** cho mọi thứ cần Infrastructure cung cấp (vd. `IApplicationDbContext`, `IEmployeeRepository`, `IUnitOfWork`, `ICurrentUserService`, `IDateTimeService`) - implementation nằm ở `Infrastructure`.
- `Infrastructure` implement các interface của `Application` và không được tham chiếu ngược lại `WebApi`.
- `WebApi` chỉ gọi vào `Application` qua `IMediator` (MediatR) - không gọi trực tiếp Repository/DbContext.

## CQRS Pattern (MediatR)

- Mỗi use case = 1 **Command** (thay đổi state) hoặc 1 **Query** (đọc dữ liệu), đặt trong `Application/Features/<Module>/Commands|Queries/<Action>/`.
- Cấu trúc mỗi use case gồm 3 file:
  - `<Action>Command.cs` / `<Action>Query.cs` - implement `IRequest<TResponse>`.
  - `<Action>CommandHandler.cs` / `<Action>QueryHandler.cs` - implement `IRequestHandler<TCommand, TResponse>`.
  - `<Action>CommandValidator.cs` - FluentValidation, chạy qua `ValidationBehavior` (MediatR pipeline).
- Command/Query trả về DTO (Application layer), **không** trả Entity (Domain) ra ngoài.
- Pipeline behaviors chuẩn (đăng ký theo thứ tự): `LoggingBehavior` → `ValidationBehavior` → `UnhandledExceptionBehavior` (hoặc theo thứ tự phù hợp middleware).

## Repository Pattern + Unit of Work

- `IRepository<T>` (generic) cho CRUD cơ bản (`GetByIdAsync`, `ListAsync`, `AddAsync`, `Update`, `Remove`) - định nghĩa ở `Domain` hoặc `Application`, implement ở `Infrastructure` (dùng EF Core `DbSet<T>`).
- Repository đặc thù (vd. `IEmployeeRepository`) kế thừa `IRepository<Employee>`, thêm method nghiệp vụ riêng (vd. `GetByDepartmentAsync`).
- `IUnitOfWork` bọc `DbContext.SaveChangesAsync()` - chỉ commit 1 lần ở cuối Handler (transaction boundary = 1 Command).
- Query (read-only) có thể bypass Repository, dùng trực tiếp `IApplicationDbContext`/`DbContext` qua `AsNoTracking()` để tối ưu performance - miễn là vẫn qua interface của Application layer.

## Dependency Injection

- Mỗi project có file `DependencyInjection.cs` (extension method `AddApplication()`, `AddInfrastructure()`) để đăng ký service, gọi từ `WebApi/Program.cs`.
- MediatR, FluentValidation, AutoMapper/Mapster đăng ký trong `AddApplication()`.
- DbContext, Repositories, UnitOfWork, JWT/Identity services đăng ký trong `AddInfrastructure()`.

## Khi tạo module mới

Tham khảo skill [`create-module`](../skills/create-module/SKILL.md) để biết quy trình end-to-end áp dụng đúng layering trên.
