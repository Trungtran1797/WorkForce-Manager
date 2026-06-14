---
name: create-crud
description: Scaffold đầy đủ CRUD (Create, Read, Update, Delete, List với filter/pagination) cho một entity của WorkForce Manager, cả backend (API) và frontend (list page + form + table actions). Dùng khi một module cần đầy đủ chức năng "Thêm/Sửa/Xóa/Tìm kiếm/Lọc" như Employee, Department, Project.
---

# Create CRUD (Backend + Frontend)

Kết hợp skill `create-api` (backend) và `create-page` (frontend). Tuân theo `.claude/rules/api-rules.md`, `.claude/rules/database-rules.md`, `.claude/rules/ui-rules.md`.

## Backend - 5 use cases chuẩn

Trong `Application/Features/<Module>/`:

1. `Create<Entity>Command` - validate input, map sang Entity, `AddAsync` + `SaveChangesAsync`.
2. `Update<Entity>Command` - load entity theo Id (404 nếu không thấy/đã soft-delete), map field mới, `SaveChangesAsync`.
3. `Delete<Entity>Command` - soft delete (`IsDeleted = true`, `DeletedDate`, `DeletedBy`), không xóa cứng.
4. `Get<Entity>ByIdQuery` - trả DTO chi tiết, 404 nếu không tồn tại.
5. `Get<Entity>ListQuery` - `PaginatedList<EntityDto>`, hỗ trợ `search` (theo các field text chính), filter theo field liên quan (vd. `departmentId`, `status`), `sortBy`/`sortDirection`.

Controller (`<Entity>sController`): map đủ 5 endpoint theo REST convention (`.claude/rules/api-rules.md`), áp `[Authorize]` theo role được phép thao tác (CRUD thường giới hạn Super Admin/Manager - xem `CLAUDE.md` → User Roles).

## Frontend - List Page + Form

1. **List Page** (`<Entity>ListPage.tsx`):
   - Table (Shadcn `Table`) với cột chính theo field entity, cột "Trạng thái" dùng `Badge` màu theo `.claude/rules/ui-rules.md`.
   - Toolbar: search input, filter dropdown(s), nút "Thêm mới".
   - Pagination control (dựa vào `totalPages`/`pageNumber` từ API).
   - Row actions: Sửa, Xóa (confirm dialog trước khi gọi Delete).
2. **Form** (`<Entity>FormDialog.tsx` hoặc page riêng cho form phức tạp):
   - `react-hook-form` + `zod` schema khớp validator backend.
   - Dùng chung cho Create/Update (truyền `defaultValues` khi Edit).
   - Submit gọi Command tương ứng qua React Query mutation, invalidate query list sau khi thành công, hiện toast kết quả.
3. **Import/Export Excel** (nếu module yêu cầu, vd. Employee Management): nút Export gọi endpoint tạo file Excel (xem skill `create-report`), nút Import upload file + hiển thị kết quả import (số dòng thành công/lỗi).

## Kiểm tra cuối

- Thử đủ luồng: thêm mới → hiện trong list → sửa → cập nhật đúng → xóa → biến mất khỏi list (nhưng vẫn còn trong DB với `IsDeleted = true`).
- Search/filter/pagination hoạt động đúng với dữ liệu thật.
- Role không có quyền → không thấy nút Thêm/Sửa/Xóa (và backend trả 403 nếu cố gọi trực tiếp).
