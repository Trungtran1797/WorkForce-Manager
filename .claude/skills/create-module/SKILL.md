---
name: create-module
description: Tạo một module nghiệp vụ mới end-to-end cho WorkForce Manager (Domain → Application → Infrastructure → WebApi → Frontend). Dùng khi cần thêm một module hoàn toàn mới (vd. Notification, Leave Management) chưa tồn tại trong hệ thống.
---

# Create Module (End-to-End)

Quy trình tạo 1 module nghiệp vụ mới, tuân theo Clean Architecture (`.claude/rules/clean-architecture.md`) và đầy đủ field/chức năng theo `CLAUDE.md`.

## Bước 1 - Domain (`backend/src/WorkForceManager.Domain`)

1. Tạo Entity kế thừa `BaseAuditableEntity` với đầy đủ field theo spec module trong `CLAUDE.md`.
2. Tạo Enum cần thiết (vd. trạng thái, loại) - lưu dạng string trong DB (`.claude/rules/database-rules.md`).
3. Định nghĩa domain exception/validation rule nếu có (vd. ngày kết thúc > ngày bắt đầu).

## Bước 2 - Application (`backend/src/WorkForceManager.Application`)

1. Tạo folder `Features/<Module>/` với `Commands/` và `Queries/`.
2. Với mỗi use case (Create/Update/Delete/GetById/GetList/...): tạo `<Action>Command|Query.cs`, `<Action>Handler.cs`, `<Action>Validator.cs` (xem skill `create-api`).
3. Tạo DTOs (`<Module>Dto.cs`) và mapping profile.
4. Định nghĩa interface repository riêng nếu module cần query đặc thù (vd. `ILeaveRequestRepository`).

## Bước 3 - Infrastructure (`backend/src/WorkForceManager.Infrastructure`)

1. Thêm `DbSet<T>` vào `ApplicationDbContext`.
2. Tạo `IEntityTypeConfiguration<T>` cho entity mới (theo skill `create-database`).
3. Implement repository (nếu có interface riêng ở bước 2).
4. Tạo migration: `dotnet ef migrations add Add<Module>Table`.
5. Seed data nếu cần (lookup values).

## Bước 4 - WebApi (`backend/src/WorkForceManager.WebApi`)

1. Tạo `<Module>sController` kế thừa `ApiControllerBase`, map mỗi action sang Command/Query qua `IMediator`.
2. Áp dụng `[Authorize]`/policy theo role được phép (xem `.claude/rules/security-rules.md` và `CLAUDE.md` → User Roles).
3. Kiểm tra response theo envelope chuẩn (`.claude/rules/api-rules.md`).

## Bước 5 - Frontend (`frontend/src`)

1. Tạo `src/features/<module>/` với `api/`, `types/`, `hooks/`, `components/`, `pages/`.
2. Tạo API client functions + React Query hooks (`useGet<Module>List`, `useCreate<Module>`...).
3. Tạo page(s) theo skill `create-page` / `create-crud` (List/Detail/Form).
4. Thêm route + menu item trong Sidebar theo role được phép truy cập.

## Bước 6 - Kiểm tra cuối

- Build backend (`dotnet build`) và frontend (`npm run build`) thành công.
- Kiểm tra checklist trong `.claude/rules/git-rules.md` (PR Checklist).
- Đối chiếu lại field/chức năng module với `CLAUDE.md` - đảm bảo không thiếu.
