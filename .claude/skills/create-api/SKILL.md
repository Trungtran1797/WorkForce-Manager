---
name: create-api
description: Tạo một API endpoint mới (Command hoặc Query) theo CQRS/MediatR cho WorkForce Manager. Dùng khi cần thêm 1 use case backend cụ thể (vd. "duyệt đơn nghỉ phép", "lấy danh sách công việc theo dự án") vào một module đã tồn tại.
---

# Create API Endpoint (CQRS + MediatR)

Tuân theo `.claude/rules/clean-architecture.md` và `.claude/rules/api-rules.md`.

## Bước 1 - Xác định loại use case

- **Command** (thay đổi state): Create/Update/Delete/đổi trạng thái (vd. `ApproveLeaveRequestCommand`).
- **Query** (đọc dữ liệu): GetById/GetList/thống kê (vd. `GetTasksByProjectQuery`).

## Bước 2 - Application Layer

Trong `Application/Features/<Module>/Commands|Queries/<Action>/`:

1. `<Action>Command.cs` / `<Action>Query.cs` - implement `IRequest<TResponse>`, chứa các property input cần thiết.
2. `<Action>CommandHandler.cs` / `<Action>QueryHandler.cs` - implement `IRequestHandler<T, TResponse>`:
   - Inject `IApplicationDbContext`/repository qua constructor.
   - Query dùng `AsNoTracking()`.
   - Command commit qua `IUnitOfWork.SaveChangesAsync(cancellationToken)`.
   - Trả về DTO, không trả Entity.
3. `<Action>Validator.cs` - FluentValidation, validate input (required, format, business rule cơ bản).

## Bước 3 - WebApi Layer

Trong Controller tương ứng (`<Module>sController`):

```csharp
[HttpPost("approve/{id}")]
[Authorize(Roles = "Manager,SuperAdmin")]
public async Task<IActionResult> Approve(int id, CancellationToken ct)
{
    var result = await _mediator.Send(new ApproveLeaveRequestCommand(id), ct);
    return Ok(ApiResponse<LeaveRequestDto>.Success(result));
}
```

- Route + HTTP verb theo convention REST (`.claude/rules/api-rules.md`).
- Áp dụng `[Authorize]`/policy đúng role (`.claude/rules/security-rules.md`, `CLAUDE.md` → User Roles).
- List endpoint: nhận `pageNumber`, `pageSize`, `search`, `sortBy`, `sortDirection` + filter đặc thù, trả `PaginatedList<T>`.

## Bước 4 - Kiểm tra

- Response đúng envelope `{ success, data, message, errors }`.
- Lỗi validation trả `400` với `errors` theo field.
- Test thử endpoint (Swagger/curl) với case hợp lệ và không hợp lệ (role sai, input sai).
- Nếu thuộc Phase 11 hoặc có business logic phức tạp, viết thêm test theo skill `create-testing`.
