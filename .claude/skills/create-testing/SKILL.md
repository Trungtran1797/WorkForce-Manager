---
name: create-testing
description: Viết test cho một feature của WorkForce Manager - unit test cho Handler (Application layer), integration test cho Controller (WebApi), và test cho component/page (frontend). Dùng cho Phase 11 (Testing) hoặc khi thêm test cho feature mới vừa hoàn thành.
---

# Create Testing (Backend + Frontend)

Tuân theo `.claude/rules/coding-standards.md` (naming convention test).

## Backend - Unit Test (Application Handlers)

Đặt trong `backend/tests/WorkForceManager.Application.Tests/Features/<Module>/`.

- Dùng xUnit + Moq (mock `IApplicationDbContext`/repository qua EF Core InMemory hoặc Moq trên interface).
- Pattern: Arrange - Act - Assert.
- Test case bắt buộc cho mỗi Handler:
  - Happy path (input hợp lệ → kết quả đúng).
  - Not found (vd. `GetByIdQuery` với Id không tồn tại → throw `NotFoundException`).
  - Business rule violation (vd. `CreateProjectCommand` với `EndDate < StartDate` → validator/handler reject).

```csharp
[Fact]
public async Task Handle_Should_ReturnLeaveRequest_When_ApprovedByManager()
{
    // Arrange
    var context = TestDbContextFactory.Create();
    context.LeaveRequests.Add(LeaveRequestFaker.PendingRequest());
    await context.SaveChangesAsync();
    var handler = new ApproveLeaveRequestCommandHandler(context, ...);

    // Act
    var result = await handler.Handle(new ApproveLeaveRequestCommand(1), default);

    // Assert
    Assert.Equal(LeaveStatus.ManagerApproved, result.Status);
}
```

## Backend - Integration Test (WebApi)

Đặt trong `backend/tests/WorkForceManager.WebApi.IntegrationTests/`.

- Dùng `WebApplicationFactory<Program>` + EF Core InMemory/SQLite test database.
- Test theo role: gọi endpoint với JWT của từng role (Super Admin/Manager/Employee), kiểm tra `200`/`403` đúng theo `.claude/rules/security-rules.md`.
- Kiểm tra response envelope đúng format (`.claude/rules/api-rules.md`).

## Frontend - Component/Page Test

Dùng Vitest + React Testing Library, đặt cạnh file component (`<Component>.test.tsx`) hoặc `__tests__/`.

- Test form validation (input sai → hiện lỗi đúng message).
- Test render theo trạng thái: loading (skeleton hiện), error (message + retry hiện), empty (empty state hiện), data (render đúng số dòng/giá trị).
- Test tương tác quan trọng: click "Thêm mới" mở dialog, submit form gọi đúng mutation, Kanban drag-drop đổi đúng trạng thái Task.

## Kiểm tra cuối

- `dotnet test` (backend) và `npm run test` (frontend) đều pass.
- Không có test bị skip/xfail mà không có lý do ghi rõ.
- Coverage tập trung vào business logic quan trọng (workflow nghỉ phép, tính % hoàn thành, phân quyền) hơn là test getter/setter đơn giản.
