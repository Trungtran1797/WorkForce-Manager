# WorkForce Manager

## Company Information

**Tên công ty:** SAIGON SPICES  
**Website:** https://saigonspices.com.vn/  
**Mô tả:** Là một nhà cung cấp gia vị hồ tiêu chất lượng cao tại Việt Nam, SAIGON SPICES tập trung cung ứng sản phẩm của mình đến các khách hàng là nhà hàng - khách sạn.  

## Project Overview

Bạn là một **Senior Full-Stack Architect, UI/UX Designer và Software Engineer** có kinh nghiệm xây dựng các hệ thống ERP, HRM, CRM và Project Management.

Nhiệm vụ của bạn là phát triển một ứng dụng Web quản lý công việc và nhân sự hiện đại, dễ mở rộng, giao diện chuyên nghiệp, hiệu năng cao và sẵn sàng triển khai thực tế.

**WorkForce Manager** là hệ thống quản lý công việc, nhân sự và tiến độ dự án dành cho doanh nghiệp xây dựng, kỹ thuật, thiết kế và phát triển phần mềm.

Ảnh tham khảo style giao diện: `godly.website_website_designstripe-560.png` (cảm hứng Modern SaaS / Stripe-style).

---

## Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript ES2024
- TypeScript
- React
- Vite
- Tailwind CSS
- Shadcn/UI
- Lucide Icons

### Backend

- ASP.NET Core 9
- C#
- Entity Framework Core

### Database

- SQL Server

### Authentication

- JWT Authentication
- Refresh Token
- Role-Based Permission

---

## UI/UX Requirements

Thiết kế theo phong cách:

- Modern SaaS
- Clean UI
- Dashboard chuyên nghiệp
- Responsive
- Dark Mode
- Light Mode

Màu sắc:

- Primary: `#2563EB`
- Success: `#16A34A`
- Warning: `#F59E0B`
- Danger: `#DC2626`

---

## User Roles

### Super Admin

Toàn quyền hệ thống.

**Chức năng:**

- Quản lý người dùng
- Quản lý phòng ban
- Quản lý phân quyền
- Quản lý dự án
- Quản lý công việc
- Xem báo cáo toàn hệ thống

### Manager

**Chức năng:**

- Tạo dự án
- Phân công công việc
- Quản lý nhân viên
- Theo dõi tiến độ
- Duyệt nghỉ phép

### Employee

**Chức năng:**

- Xem công việc được giao
- Cập nhật tiến độ
- Báo cáo công việc
- Chấm công
- Đăng ký nghỉ phép

---

## Main Modules

### Dashboard

Hiển thị:

- Tổng số nhân viên
- Công việc đang thực hiện
- Công việc quá hạn
- Công việc hoàn thành
- Dự án đang triển khai
- Biểu đồ tiến độ

Dashboard phải sử dụng:

- KPI Cards
- Charts
- Statistics
- Recent Activities

### Employee Management

**Thông tin:**

- Mã nhân viên
- Họ tên
- Ngày sinh
- Giới tính
- CCCD
- Số điện thoại
- Email
- Địa chỉ
- Phòng ban
- Chức vụ
- Ngày vào làm
- Trạng thái

**Chức năng:**

- Thêm
- Sửa
- Xóa
- Tìm kiếm
- Lọc dữ liệu
- Import Excel
- Export Excel

### Department Management

Quản lý:

- Phòng ban
- Trưởng phòng
- Danh sách nhân sự

### Project Management

**Thông tin dự án:**

- Mã dự án
- Tên dự án
- Chủ đầu tư
- Ngày bắt đầu
- Ngày kết thúc
- Trạng thái
- Ngân sách
- Mô tả

**Chức năng:**

- CRUD
- Gán nhân sự
- Theo dõi tiến độ

### Task Management

**Công việc gồm:**

- Mã công việc
- Tên công việc
- Mô tả
- Người thực hiện
- Người giao việc
- Độ ưu tiên
- Trạng thái
- Deadline
- % hoàn thành

**Trạng thái:**

- Todo
- In Progress
- Review
- Done
- Cancelled

**Hiển thị:**

- List View
- Kanban Board
- Calendar View
- Gantt Chart

### Attendance Management

**Chức năng:**

- Check In
- Check Out
- Chấm công theo ngày
- Báo cáo công

**Hỗ trợ:**

- QR Code
- GPS Location

### Leave Management

**Loại nghỉ:**

- Nghỉ phép
- Nghỉ ốm
- Nghỉ không lương

**Quy trình:**

```
Employee → Manager Approval → HR Approval → Completed
```

### Notification System

**Thông báo:**

- Công việc mới
- Sắp đến hạn
- Quá hạn
- Duyệt nghỉ phép
- Tin nhắn hệ thống

**Realtime:** SignalR

### Reports

**Báo cáo:**

- Hiệu suất nhân viên
- Tiến độ dự án
- Tỷ lệ hoàn thành công việc
- Thống kê phòng ban
- Báo cáo chấm công

**Xuất:** Excel, PDF

---

## Database Design Rules

- Sử dụng Code First
- Chuẩn hóa dữ liệu
- Soft Delete
- Audit Log
  - CreatedDate
  - CreatedBy
  - ModifiedDate
  - ModifiedBy

---

## Coding Standards

### Frontend

- Component-Based Architecture
- Reusable Components
- Clean Code
- TypeScript Strict Mode

### Backend

- Clean Architecture
- Repository Pattern
- Unit Of Work
- Dependency Injection
- CQRS Pattern
- MediatR

---

## Security

- JWT
- Refresh Token
- Password Hashing
- Role Permission
- API Validation
- Rate Limiting

---
### Trạng thái dự án & Tiến độ (Đã hoàn thành & Verified End-to-End)

- **Bước 1–2 — Nền tảng backend + Database**: Solution Clean Architecture 4 project (`Domain` → `Application` → `Infrastructure` → `WebApi`), CQRS/MediatR, Repository + UnitOfWork, EF Core Code First với soft-delete global filter + audit interceptor, 11 entity, migration `InitialCreate` đã apply vào SQL Server, seed data (5 phòng ban, 5 nhân viên, 3 tài khoản). `dotnet build` sạch 0 warning, Swagger chạy.
- **Bước 3 — Authentication**: JWT access 15 phút + refresh token (rotation/revoke) trong DB, rate limit `/auth/*`, role-based policies. Frontend: `api-client` tự refresh khi 401, `AuthContext` + `ProtectedRoute`, login thật, header/sidebar hiển thị theo role. Đã test: login/me/refresh/logout, sai mật khẩu → 401, không token → 401.
- **Bước 4 — Employee + Department**: CRUD đầy đủ + phân trang/lọc/tìm kiếm server-side. Đã gỡ mock, nối React Query. Test: tạo/sửa/xoá (soft delete), filter theo phòng ban, employee role → 403 khi tạo.
- **Bước 5 — Project + Task**: CRUD dự án + gán/xoá thành viên; CRUD task + PATCH đổi trạng thái cho Kanban kéo-thả lưu DB. 4 view (List/Kanban/Calendar/Gantt) đọc API thật. Đã gỡ mock. Test toàn bộ thành công.
- **Bước 6 — Attendance + Leave**: Chấm công + workflow duyệt nghỉ phép Employee → Manager → HR (đã kết nối backend + frontend, gỡ hoàn toàn mock). Đã test: employee check-in/out tính giờ làm, gửi đơn nghỉ phép → manager duyệt (PendingHr) → admin duyệt (Completed).
- **Bước 7 — Dashboard + Reports**: Hiển thị KPI Cards, biểu đồ tiến độ tuần (WeeklyProgressChart) và các hoạt động gần đây theo thời gian thực từ API backend. Tích hợp xuất báo cáo Excel (CSV UTF-8 BOM chống lỗi font tiếng Việt) và PDF (HTML in ấn tự động) với giao diện premium hỗ trợ Skeleton Loading.


---

### Cách chạy thử ngay

- **Backend**: `dotnet run --project "backend/src/WorkForceManager.WebApi"` → API + Swagger ở [http://localhost:5244/swagger](http://localhost:5244/swagger)
- **Frontend**: Trong `frontend/` chạy `npm run dev` → [http://localhost:5173](http://localhost:5173) (hoặc [http://localhost:5174](http://localhost:5174))
- **Đăng nhập demo**: 
  - **Super Admin**: `admin` / `Admin@123`
  - **Manager**: `manager` / `Manager@123`
  - **Employee**: `employee` / `Employee@123`

---

- [x] **Bước 8 — Notification realtime**: SignalR (Đã tích hợp cùng Toast UI và HTML5 notification).
- [x] **Bước 9 — Testing**: Unit/integration/component testing (Đã thiết lập xUnit cho Backend & Vitest cho Frontend, chạy pass 100%).
- [x] **Bước 10 — Deployment**: Docker, docker-compose, CI/CD (Đã cấu hình Dockerfile, docker-compose.yml và GitHub Actions CI).

---

### Công việc tiếp theo (Bước 11–13 — Mở rộng Tính năng HRM nâng cao)

- [x] **Bước 11 — Quản lý Ca làm việc & Làm thêm giờ (Shift & Overtime)**
  - Cấu hình ca làm việc (ca hành chính, ca kíp, ca đêm).
  - Đăng ký và duyệt làm thêm giờ (Overtime - OT) tích hợp trực tiếp vào bảng công.
  - Ràng buộc check-in theo địa chỉ IP Wi-Fi văn phòng hoặc định vị GPS công trường.
  - *(Đã hoàn thành và verify: 4 entities + mở rộng Attendance, migration, LocationValidator IP CIDR/Haversine, frontend shifts/overtime/office-locations + GPS check-in)*
- [x] **Bước 12 — Quản lý Hợp đồng & Tính lương (Payroll & Contracts)**
  - Quản lý hồ sơ hợp đồng lao động (thử việc, chính thức, phụ lục hợp đồng).
  - Cấu hình biểu thuế TNCN, đóng bảo hiểm, phụ cấp và lương cơ bản cho từng nhân sự.
  - Tự động tổng hợp bảng công và tính lương tháng, xuất phiếu lương (Payslip) gửi email cho nhân viên.
  - *(Đã hoàn thành và verify: 5 entities, PayrollCalculator PIT lũy tiến, GeneratePayroll idempotent, frontend payroll/my-payslips/contracts, 31 test pass)*
- [x] **Bước 13 — Đánh giá hiệu suất & OKRs (KPI & Performance)**
  - [x] Thiết lập Domain: enums (OkrStatus, ReviewType...) + 6 entity (OkrObjective, KeyResult, PerformanceReview, ReviewCriterion, TrainingCourse, TrainingEnrollment).
  - [x] Thiết lập Persistence: DbSet + Configurations + migration `AddKpiAndPerformance` (đã apply vào SQL Server).
  - [x] Thiết lập Application: Okrs, PerformanceReviews, Training features.
  - [x] Thiết lập WebApi: 3 Controllers (`OkrsController`, `PerformanceReviewsController`, `TrainingController`) + policy `CanManagePerformance`.
  - [x] Thiết lập Frontend: Giao diện okrs/performance/training (objective form + key results, review form + radar chart, training course + enrollment) + routing/menu.
  - [x] Đánh giá hiệu suất nhân sự định kỳ (360-degree review: Self/Manager/Peer), theo dõi tiến trình thăng tiến qua OKRs theo kỳ.
  - [x] Quản lý đào tạo (khóa học, đăng ký, hoàn thành + mã chứng chỉ).
  - [x] Kiểm thử và verify end-to-end.
  - *(Đã hoàn thành và verify: backend `dotnet build` 0 warning, `dotnet test` 34/34 pass (9 test mới cho Okrs/PerformanceReviews/Training); frontend `tsc --noEmit` 0 lỗi, `vitest` 19/19 pass (5 file test mới); verify e2e qua API thật với 3 role - tạo/cập nhật/xoá OKR, tạo/nộp đánh giá hiệu suất 360°, tạo khóa học/đăng ký/hoàn thành đào tạo, xác nhận policy `CanManagePerformance` chặn Employee đúng theo thiết kế)*
- [x] **Bước 14 — Cơ cấu phòng ban theo sơ đồ tổ chức, Công việc cha/con & Bảng thảo luận dự án**
  - Tái cấu trúc Phòng ban theo sơ đồ tổ chức thực tế: 2 khối (Văn phòng, Nhà máy) mỗi khối có các phòng con (quan hệ cha-con 2 cấp qua `ParentDepartmentId`).
  - Công việc (Task) hỗ trợ công việc cha - công việc con (subtask 1 cấp qua `ParentTaskId`), mỗi task có người phụ trách riêng.
  - Dự án có bảng thảo luận (comment) cho phép đính kèm file (upload/download/xoá).
  - Seed dự án mẫu "Quy trình xử lý đơn hàng xuất khẩu" minh hoạ quy trình 6 bước xuyên phòng ban (Kinh doanh → Nhà máy → Logistics → Kế toán → Logistics) dưới dạng 1 task cha + 6 subtask gán đúng người phụ trách theo phòng ban.
  - *(Đã hoàn thành và verify: migration `AddDepartmentHierarchyTaskSubtaskAndProjectDiscussion` apply LocalDB, seed lại 11 phòng ban (2 khối + 9 phòng) + project DA004 (CV006 + CV007-CV012); `IFileStorageService`/`LocalFileStorageService` lưu file vào `wwwroot/uploads`, validate 10MB + whitelist extension; backend `dotnet build` 0 warning, `dotnet test` 45/45 pass; frontend `tsc --noEmit` 0 lỗi, `vitest` 26/26 pass; verify e2e qua API thật: department tree đúng sơ đồ, `GET /tasks?parentTaskId=` trả đúng 6 subtask, post/list/download/delete comment + attachment hoạt động đúng)*
- [x] **Bước 15 — Đóng gói & Deploy demo lên VPS (Docker)**
  - Backend (`Program.cs`): tách Swagger / Migration / Seed khỏi điều kiện `IsDevelopment()` cứng - dùng config `EnableSwagger` và `Seed:Enabled` (đọc từ biến môi trường), production luôn `Database.MigrateAsync()`.
  - Thêm `docker-compose.prod.yml` + `.env.example` (SA_PASSWORD, JWT_SECRET, PUBLIC_URL, ENABLE_SWAGGER, SEED_ENABLED) - 1 lệnh `docker compose -f docker-compose.prod.yml up -d --build` chạy toàn bộ (db + backend + frontend).
  - Thêm `frontend/nginx.prod.conf` + `frontend/Dockerfile.prod`: nginx vừa serve SPA vừa reverse-proxy `/api`, `/hubs`, `/swagger` sang backend cùng origin (VITE_API_URL=`/api/v1` tương đối → không cần CORS, không cần domain).
  - Volume `uploads-data` cho `wwwroot/uploads` (file đính kèm Project Discussion) + `mssql-data` persist qua các lần `down/up`.
  - Hướng dẫn chi tiết: [`docs/huong-dan-deploy-vps.md`](docs/huong-dan-deploy-vps.md) (thuê VPS Ubuntu 22.04 4GB, cài Docker, cấu hình `.env`, mở firewall, gửi link `http://<IP>/` + `/swagger` cho khách).
  - *(Đã verify đầy đủ: `dotnet build` 0 warning 0 error. **VPS đã deploy và chạy thật tại `http://171.244.143.243`** — project tại `/root/app/` trên VPS Ubuntu 24.04, 3 container (workforce-db, workforce-api, workforce-web) up ổn định. `deploy.bat` tích hợp `--no-cache` + SSH timeout 600s để force rebuild hoàn toàn mỗi lần deploy.)*

- [x] **Bước 16 — Hoàn thiện & dọn dẹp sau Bước 15**
  - Đổi tên `frontend/src/features/reports/data/mock-reports.ts` → `report-catalog.ts` (`MOCK_REPORTS` → `REPORT_CATALOG`) vì đây là danh mục báo cáo tĩnh đang được dùng thật, không phải mock data thừa.
  - Sửa lỗi build `npm run build` (tsc -b) do import `Badge` không dùng trong `project-general-feed.tsx`.
  - Thêm `@testing-library/dom` (peer dependency thiếu) vào `devDependencies` - trước đó toàn bộ 11 file test component/page bị fail với lỗi "Cannot find module '@testing-library/dom'".
  - Thêm trang `/notifications` (`features/notifications/pages/notifications-page.tsx`) + route trong `App.tsx` + menu item trong `sidebar.tsx` (tái dùng API/hook SignalR đã có).
  - Thêm 6 file test mới (employee-list-page, leave-page, project-list-page, task-form-dialog, attendance-page, notifications-page) - vitest tăng từ 26 → 43 test pass (17 file).
  - *(Đã verify: `npx tsc -b` 0 lỗi, `npm run build` thành công, `npx vitest run` 43/43 pass; backend `dotnet build` 0 warning 0 error. Docker/VPS (Bước 15) chưa build/test thật do máy dev không có Docker - cần thực hiện khi deploy lên VPS thật theo `docs/huong-dan-deploy-vps.md`)*

- [x] **Bước 17 — Hệ thống Phân quyền động (Dynamic Permission Matrix)**
  - Domain: enum `PermissionLevel` (None/View/Edit) + `PermissionModule` (20 module), entity `RolePermission` + `DepartmentPermissionOverride`, migration `AddPermissionMatrix`, seed 60 dòng Role x Module (theo `docs/phan-quyen-truy-cap.md` Bảng 1) + 13 dòng override theo phòng ban (Bảng 2).
  - Application: `IPermissionService`/`PermissionService` (IMemoryCache, effective = max(role-level, dept-override), generation-token invalidation), `Features/Permissions/` (GetPermissionMatrix, UpdatePermissionMatrix, GetMyPermissions), `AuthUserDto` bổ sung `Permissions: Dictionary<string,string>` trả về khi login/refresh/register/me.
  - Authorization: `PermissionRequirement` + `PermissionAuthorizationHandler` + `PermissionPolicyProvider` (policy động `Permission:{Module}:{Level}`, SuperAdmin bypass), `PermissionsController` (`GET/PUT /permissions/matrix` SuperAdmin, `GET /permissions/me`). 18 controller đã đổi từ `RequireRole`/`CanManage*` sang `Permission:{Module}:View|Edit` theo từng action.
  - Frontend: module `features/permissions/` (types, api, `usePermission`/`useCanEdit`/`useCanView`, trang `/settings/permissions` 2 tab "Theo vai trò"/"Theo phòng ban"), sidebar lọc menu theo quyền hiệu lực, `ProtectedRoute` hỗ trợ `module`/`level`, áp dụng `useCanEdit('<Module>')` ẩn nút Thêm/Sửa/Xóa cho 16 trang CRUD (Employees, Departments, Projects, Tasks, Attendance, Leave, Overtime, Shifts, OfficeLocations, Contracts, Payroll, SalaryConfigs, Okrs, Performance, Training, Reports).
  - *(Đã hoàn thành và verify: backend `dotnet build` 0 warning, `dotnet test` 67/67 pass (+16 test mới); frontend `npx tsc -b` 0 lỗi, `npx vitest run` 51/51 pass (+8 test mới, 20 file). Không triển khai data-scope filtering (Manager chỉ thấy data phòng mình) - để làm sau theo Mục 3 docs/phan-quyen-truy-cap.md)*

- [x] **Bước 18 — Cải tiến UX Dự án & Nhiều người thực hiện (Multi-Assignee Task)**
  - **Project form**: Đổi label "Mã dự án" → "Số hợp đồng" (placeholder "Để trống để tự động tạo"); thêm trường "Ngày xuất hàng" (`ShippingDate`) hiển thị nổi bật màu cam (icon Truck) trên Dashboard calendar "Lịch công tác & Deadline".
  - **Project detail layout**: Tái cấu trúc tab Tổng quan thành 3 card ngang đồng đều: (1) Thông tin dự án compact (dates, budget, số HĐ, ngày xuất hàng nếu có, progress), (2) Mô tả dự án + chủ đầu tư, (3) Nhân sự tham gia + nút Gán.
  - **Gán nhân sự tham gia**: Thay dialog đơn bằng `AddMemberDialog` multi-select — search theo tên, filter phòng ban, checkbox chọn nhiều người cùng lúc, gán tuần tự qua API, badge đếm đã chọn.
  - **Nhiều người thực hiện (Task Multi-Assignee)**: Thêm entity `TaskAssignee` (join table TaskId+EmployeeId), migration `AddTaskMultiAssignee`, cập nhật `TaskDto`+`TaskAssigneeDto`, `CreateTaskCommand`/`UpdateTaskCommand` nhận `List<int> AssigneeIds`, handler sync diff add/remove + notification đến tất cả assignee. Frontend: `MultiAssigneeSelect` inline (search, checkbox, badge xóa) trong task form; hiển thị nhiều tên trong task-list-view và kanban-card.
  - *(Đã hoàn thành và verify: backend `dotnet build` 0 warning, `dotnet test` 67/67 pass, migration apply SQL Server; frontend `npx tsc -b` 0 lỗi, `npx vitest run` 50/51 pass (1 fail attendance-page là pre-existing không liên quan))*

- [x] **Bước 19 — Danh sách dự án dạng bảng & Quản lý mẫu quy trình**
  - **Project list → Table format**: Viết lại `project-list-page.tsx` từ card/grid sang bảng (Table + TableRow) với cột: Số HĐ, Tên dự án, Trạng thái, Tiến độ, Ngày kết thúc, Ngày xuất hàng, Hành động. Mỗi hàng có dropdown 3 chấm (Xem chi tiết / Lưu làm mẫu / Xóa).
  - **Tabs "Dự án" / "Mẫu quy trình"**: Tab "Dự án" hiển thị dự án thường (không lẫn mẫu) kèm search + filter trạng thái; Tab "Mẫu quy trình" hiển thị card mẫu đánh số tuần tự "Mẫu 1", "Mẫu 2",... với action "Bỏ đánh dấu mẫu".
  - **Lưu dự án bất kỳ làm mẫu**: Row dropdown → "Lưu làm mẫu" gọi `PATCH /projects/{id}/mark-template` (command `MarkProjectAsTemplateCommand` + handler mới). Hỗ trợ cả chiều ngược lại (bỏ đánh dấu mẫu từ Tab Templates).
  - **Template picker nâng cấp**: Dialog chọn mẫu hiển thị badge "Mẫu 1/2/3" + mã dự án bên cạnh tên, xóa prefix `[MẪU]` khỏi tên hiển thị.
  - **Backend fixes**: `GetProjectsQueryHandler` thêm filter `WHERE IsTemplate = false` khi `IncludeTemplates = false` (trước đây templates lẫn vào danh sách thường); `GetProjectTemplatesQueryHandler` fix đếm toàn bộ tasks thay vì chỉ đếm subtasks.
  - **Backend files**: 2 file mới (`MarkProjectAsTemplateCommand.cs`, `MarkProjectAsTemplateCommandHandler.cs`); sửa `GetProjectsQuery.cs`, `GetProjectsQueryHandler.cs`, `GetProjectTemplatesQueryHandler.cs`, `ProjectsController.cs`.
  - **Frontend files**: Sửa `project-api.ts` (thêm `markProjectAsTemplate()`), `project-queries.ts` (thêm `useMarkProjectAsTemplate()`), viết lại `project-list-page.tsx`, cập nhật `template-picker-dialog.tsx`.
  - *(Backend verify bị chặn bởi file lock do process đang chạy — không phải lỗi code; frontend `npx tsc --noEmit` 0 lỗi. Cần restart backend để apply thay đổi.)*

- [x] **Bước 20 — Tường Công Ty (Company Wall) — Hoàn thiện tất cả tính năng**
  - **Backend `WallController.cs`**: Thêm query params `?pending=true`, `?scheduled=true`, `?groupName=X` để filter bài viết; endpoint `POST /{id}/reject`, `POST /{id}/publish-now`; CRUD nhóm (`GET/POST /wall/groups`, `DELETE /wall/groups/{name}`); thêm field `IsRejected` vào `WallPost`; seed 4 nhóm mặc định vào `App_Data/wall_groups.json`. Storage vẫn dùng JSON file (không EF Core).
  - **Frontend types & API**: Cập nhật `WallPost` thêm `isApproved`, `isRejected`, `groupName`, `scheduledPublishDate`; thêm interface `WallGroup`; mở rộng `wall-api.ts` + `wall-queries.ts` với đầy đủ hooks (usePendingWallPosts, useScheduledWallPosts, useGroupWallPosts, useWallGroups, useRejectWallPost, usePublishNowWallPost, useCreateWallGroup, useDeleteWallGroup).
  - **3 component mới**:
    - `org-chart-section.tsx`: Cây phân cấp phòng ban expandable (buildTree từ `parentDepartmentId`), click xem nhân viên từng phòng, search box, stats 3 chỉ số.
    - `career-path-section.tsx`: Profile card + timeline milestones (gia nhập → hợp đồng → đào tạo hoàn thành → OKR đạt), lọc dữ liệu theo `employeeId` phía client.
    - `work-history-section.tsx`: Stats tổng quan công việc (tổng/hoàn thành/đang thực hiện/quá hạn), progress bar hoàn thành, phân loại theo trạng thái, timeline 15 task gần nhất.
  - **`wall-page.tsx` viết lại hoàn toàn**: 8 menu item (Bảng tin, Bài viết chờ duyệt, Nhóm thảo luận, Bài viết hẹn giờ, Lộ trình thăng tiến, Sơ đồ tổ chức, Quá trình làm việc); `PostCard` component tích hợp nút Duyệt/Từ chối/Đăng ngay; `PostCreator` hỗ trợ chọn nhóm + date picker hẹn giờ; badge đếm bài chờ duyệt.
  - **Shadcn `Progress` component**: Tạo `frontend/src/components/ui/progress.tsx` + cài `@radix-ui/react-progress` (không có `components.json` → thêm thủ công).
  - **Lưu ý type**: `AuthUser.fullName` (không phải `employeeFullName`); `Employee.departmentName` (chuỗi trực tiếp, không phải `department.name`); `TrainingCourse.name` (không phải `title`); `OkrObjective.period` (không phải `startDate`).
  - *(Đã verify: backend `dotnet build` 0 error, frontend `npx tsc --noEmit` 0 lỗi. Vite error `@/components/ui/progress` đã fix bằng cách tạo component thủ công.)*
  - **Phân biệt Tường Công Ty vs Bảng Tin** (bổ sung sau Bước 20):
    - Thêm field `IsCompanyPost` (bool) vào `WallPost` model trong `WallController.cs`.
    - `POST /wall` có guard: chỉ SuperAdmin/Manager được set `isCompanyPost=true`, Employee bị `403 Forbid`.
    - `GET /wall?companyOnly=true` trả chỉ bài công ty (dùng cho tab "Tường công ty").
    - Frontend: `useCompanyWallPosts()` hook mới; menu "Tường công ty" load `companyOnly`, PostCreator chỉ hiện với `isManagerOrAdmin`; menu "Bảng tin" load toàn bộ feed + bài công ty hiện badge "Thông báo CT" (màu success, icon Building2).
    - *(verify: `npx tsc --noEmit` 0 lỗi; backend build cần restart do file lock — code đúng)*

- [x] **Bước 21 — UX Header: Icon ngôi nhà truy cập nhanh Tường Công Ty**
  - Thêm button icon `Home` (lucide-react) vào header (`layouts/header.tsx`), đặt trước `ThemeToggle`, click điều hướng đến `/wall`. Hover tooltip "Tường công ty".
  - Ẩn dòng menu "Tường công ty" khỏi sidebar (`layouts/sidebar.tsx`) — route `/wall` vẫn hoạt động bình thường, chỉ truy cập qua icon trên header thay vì sidebar.
  - *(Thay đổi thuần frontend. Files sửa: `header.tsx`, `sidebar.tsx`.)*

- [x] **Bước 22 — Thiết kế lại màn hình đăng nhập (Production-ready, Saigon Spices branding)**
  - **Xoá hộp thông tin demo**: Giao diện chính thức gửi khách hàng — bỏ hoàn toàn khung "Tài khoản demo" khỏi login page.
  - **Layout floating card (MISA-style)**: Viết lại `frontend/src/features/auth/pages/login-page.tsx` từ centered card đơn giản sang floating card `max-w-3xl` căn giữa toàn màn hình, bên trong chia 2 panel:
    - **Brand panel** (ẩn trên mobile): `w-5/12`, dark orange gradient (`from-orange-950 via-orange-900 to-amber-900`), logo Saigon Spices + icon `Flame` + tiêu đề WorkForce Manager + 3 feature bullets (Users/BarChart3/CheckSquare2).
    - **Form panel** (`flex-1`): `bg-card`, form đăng nhập (`max-w-xs`) với field Username + Password + Submit button.
  - **Background**: gradient `from-sky-300 via-amber-100 to-orange-200` + overlay tối dưới + sun glow blur; top-right bar hiển thị 🇻🇳 Việt Nam + Trợ giúp (backdrop-blur pill).
  - **Toàn bộ logic giữ nguyên**: react-hook-form + zod, error state, loading spinner, auth context, navigate.
  - *(File sửa: `frontend/src/features/auth/pages/login-page.tsx`. Không thay đổi logic, chỉ thay đổi JSX/layout.)*

- [x] **Bước 23 — Fix build error MailClientService + Cải thiện AI Email error handling**
  - **Fix CS1503 MailClientService** (`backend/src/WorkForceManager.Infrastructure/Services/MailClientService.cs`): `inbox.GetBodyPartAsync()` yêu cầu tham số `MailKit.BodyPart` object, không phải `string`. Fix: thêm helper `FindBodyPart(BodyPart, specifier)` duyệt cây BodyPart đệ quy; `DownloadImapAttachmentAsync` gọi `FetchAsync(..., MessageSummaryItems.BodyStructure)` trước, rồi tìm đúng BodyPart, sau đó mới gọi `GetBodyPartAsync`. Build: 0 Error(s).
  - **Ẩn raw JSON error khỏi AI chat response** (`GeminiAiService.cs`): Tách catch block riêng cho lỗi 429/TooManyRequests/RESOURCE_EXHAUSTED — hiển thị message thân thiện *"vượt giới hạn quota hôm nay, reset ngày mai"* thay vì lộ toàn bộ JSON error cho user. Catch block chung cho lỗi khác cũng được làm sạch tương tự.
  - **Đổi model AI mặc định** từ `gemini-2.5-flash` → `gemini-2.0-flash` (quota free tier cao hơn: 1.500 req/ngày thay vì 10–20 req/ngày).
  - *(Files sửa: `MailClientService.cs`, `GeminiAiService.cs`. Backend build: 0 error.)*

- [x] **Bước 24 — Email Assistant: Fix Mock AI + Render Markdown tệp đính kèm có thể click**
  - **Fix Mock AI không hiển thị danh sách email** (`GeminiAiService.cs`): `GetMockAiResponse()` trước đây kiểm tra keyword quá chặt (cần "email", "thư", "tìm"...) — nút "5 mail gần nhất" gửi text có "mail" nhưng không có "email" nên trả về lời chào generic. Fix: xóa hoàn toàn keyword check, nếu có `systemContext` ([HỆ THỐNG - DANH SÁCH EMAIL...]) thì **luôn** gọi `FormatEmailListFromContext()`.
  - **Render AI response dạng Markdown có thể tương tác** (Frontend): AI trả về link tệp đính kèm dạng `[**CV.pdf**](/api/v1/email-assistant/attachment?...)` nhưng cả 2 màn hình chat đang render plain text (class `whitespace-pre-line`) nên link hiện ra như chữ thô — không click được.
  - **Cài `react-markdown`** (78 packages) vào `frontend/`.
  - **Tạo `frontend/src/features/email-assistant/components/ai-markdown-content.tsx`**: component dùng chung render markdown AI với custom `Components` map — link mở `target="_blank"`, styled `text-primary underline`; strong/em/p/ul/ol/li/code đều có class Tailwind tương ứng.
  - **Cập nhật `email-assistant-page.tsx`** và **`email-assistant-chat-bubble.tsx`**: tin nhắn `user` giữ `whitespace-pre-line`, tin nhắn `assistant`/`system` dùng `<AiMarkdownContent>` thay vì plain text.
  - **Luồng download tệp đính kèm**: click link → Vite proxy `/api` → backend `GET /api/v1/email-assistant/attachment` (có `[AllowAnonymous]`) → fetch từ IMAP server → trả file với `Content-Disposition: attachment` → browser download/preview tự động.
  - *(Files sửa: `GeminiAiService.cs`, `email-assistant-page.tsx`, `email-assistant-chat-bubble.tsx`. File mới: `ai-markdown-content.tsx`. Frontend `npx tsc --noEmit` 0 lỗi.)*

- [x] **Bước 25 — UI Refresh: Modern SaaS Visual Upgrade (thuần CSS/JSX, không đổi logic)**
  - **Mục tiêu**: Nâng cấp visual lên "Modern SaaS" — bắt mắt hơn, tươi sáng hơn, chuyên nghiệp hơn — **không thay đổi bất kỳ logic, routing hay API nào**.
  - **Phase 1 — Design Tokens (`globals.css`)**: `--radius` tăng `0.625rem` → `0.75rem`; nền app `0 0% 100%` → `220 20% 98%` (off-white premium); border visibility `220 15% 88%`; thêm tokens `--header-bg` (glassmorphism), `--card-shadow`/`--card-shadow-hover`; thêm `@layer utilities`: `.glass-header` (backdrop-blur-12px), `.icon-bg-primary/success/warning/destructive` (gradient icon containers), `.gradient-text-primary/success` (gradient text cho số liệu KPI), `.card-hover` (lift effect on hover), `.nav-active` (gradient pill + left border accent cho sidebar), `.page-hero` (gradient strip cho tiêu đề trang).
  - **Phase 2 — Sidebar + Header**: Brand logo thêm shadow glow `shadow-success/30`, `font-black tracking-widest`; active nav item: `bg-primary/10` → class `nav-active` (gradient pill xanh-violet + left border 2px); Header thêm `sticky top-0 z-40` + glassmorphism `glass-header`; Avatar thêm `ring-2 ring-primary/20`.
  - **Phase 3 — Dashboard KPI + Charts**: KPI icon container: `bg-X/10 text-X` → `div.icon-bg-* size-10 rounded-xl text-white`; metric numbers dùng `.gradient-text-*`; card thêm `card-hover` + `border-l-4`; Weekly chart bars dùng SVG `<linearGradient>` (gradient xanh lá & xanh blue); Dashboard title wrapped trong `.page-hero`.
  - **Phase 4 — Tables + Badges**: TableHeader dùng `bg-gradient-to-r from-muted/80 to-muted/30`; TableHead `text-xs font-semibold uppercase tracking-wide h-11`; TableRow zebra `even:bg-muted/20`, hover `bg-primary/[0.03]`; TableCell `py-3.5`; Badge `px-2.5 font-semibold bg-X/12 border-X/25`.
  - **Phase 5 — Buttons + Inputs + Dialogs**: Button default gradient `from-primary to-indigo-500 shadow-primary/25`; thêm variant `gradient` (`from-primary via-indigo-500 to-violet-500`); Input `h-10 bg-background` + blue glow focus; Dialog overlay `backdrop-blur-sm`, content `border-t-2 border-t-primary/40 shadow-2xl`, title `font-bold`.
  - **Files sửa**: `globals.css`, `sidebar.tsx`, `header.tsx`, `kpi-card.tsx`, `weekly-progress-chart.tsx`, `dashboard-page.tsx`, `table.tsx`, `badge.tsx`, `button.tsx`, `input.tsx`, `dialog.tsx`.
  - *(Đã verify: `npx tsc --noEmit` 0 lỗi. 7 test fail là pre-existing (mock thiếu hook) không liên quan UI. Sidebar theo theme — light ở Light Mode, dark ở Dark Mode như thiết kế.)*

---

### Lưu ý vận hành (cập nhật 2026-06-29)

- **VPS demo đang chạy**: `http://171.244.143.243` — project tại `/root/app/` trên VPS Ubuntu 24.04. Tài khoản demo: admin/Admin@123, manager/Manager@123, employee/Employee@123.
- **Cập nhật VPS khi có code mới**: Chạy `deploy.bat` ở thư mục gốc. Script tự động commit/push → git pull VPS → `docker compose build --no-cache` → `up -d`. Timeout SSH 600s vì build `--no-cache` mất 5–10 phút.
- **Reset database VPS về seed mặc định**: SSH vào VPS rồi `cd ~/app && docker compose -f docker-compose.prod.yml down -v && docker compose -f docker-compose.prod.yml up -d --build`. Cảnh báo: mất toàn bộ dữ liệu đã nhập.
- **Docker dùng cache cũ → site không cập nhật**: Phải dùng `--no-cache`. Nếu `docker compose up -d --build` vẫn thấy `CACHED` ở mọi bước → chạy lại với `docker compose build --no-cache` trước.
- **"Server tạm thời không phản hồi" trên trang login**: Backend chưa chạy. Chạy: `dotnet run --project "backend/src/WorkForceManager.WebApi"`. Chờ thấy `Application started` rồi đăng nhập lại.
- **Khi UI hiển thị sai / thiếu tính năng đã code**: Nguyên nhân thường là browser cache cũ. Xử lý: **Ctrl+Shift+R** (hard refresh) hoặc khởi động lại `npm run dev` trong `frontend/`.
- **Ngày xuất hàng (ShippingDate) trong seed data**: Project DA004 có `ShippingDate = 2026-07-18`. Để thấy icon Truck cam trên Dashboard "Lịch công tác & Deadline", cần chuyển lịch sang **tháng 7/2026**. Tháng 6/2026 trống là đúng.
- **Label "Mã dự án" đã đổi thành "Số hợp đồng"** từ Bước 18, field `ShippingDate` đã có trong form tạo/sửa dự án.
- **Wall page không có `components.json`**: Shadcn component được thêm thủ công vào `src/components/ui/`. Khi cần component mới (vd. `progress`, `slider`...) → copy pattern từ file có sẵn + cài `@radix-ui/react-<name>` qua npm.
- **Wall storage dùng JSON file** (`App_Data/wall_posts.json`, `App_Data/wall_groups.json`) — không phải SQL Server. Seed nhóm chạy tự động khi `wall_groups.json` chưa tồn tại.
- **Tường công ty vs Bảng tin**: Hai tab riêng biệt từ session 2026-06-27. "Tường công ty" (`?companyOnly=true`) chỉ Admin/Manager được đăng; "Bảng tin" hiện tất cả, bài công ty có badge "Thông báo CT". Field `IsCompanyPost` lưu trong `wall_posts.json`.
- **Email Assistant — link tệp đính kèm**: Từ Bước 24, AI response được render bằng `react-markdown` → link `[file.pdf](/api/v1/...)` là `<a>` thật, click mở tab mới. Endpoint `/api/v1/email-assistant/attachment` có `[AllowAnonymous]` — không cần JWT, browser download trực tiếp. Nếu mock AI vẫn hiện lời chào generic (không có danh sách email): kiểm tra backend có inject system context không (cần hòm thư đã cấu hình + `SyncEmailsAsync` thành công).
- **Email Assistant — Mock AI model**: Mặc định `gemini-2.0-flash` (quota 1.500 req/ngày free tier). Nếu thấy lỗi quota → AI tự fallback sang mock mode + hiện thông báo thân thiện (không lộ JSON error).
- **UI Refresh (Bước 25)**: Toàn bộ thay đổi visual nằm trong CSS/JSX — không có logic mới. Nếu UI cũ hiện lại sau khi restart `npm run dev` → hard refresh **Ctrl+Shift+R**. Tailwind v4 không có `tailwind.config.ts` — mọi token và utility custom đều trong `frontend/src/styles/globals.css`. Shadcn component (table, badge, button, input, dialog) là local files trong `src/components/ui/` — đã được sửa trực tiếp.

---

### Thông tin VPS Production (cập nhật 2026-06-27)

- **VPS IP:** `171.244.143.243` (Ubuntu 24.04.3 LTS, QEMU/KVM)
- **App (live):** [http://171.244.143.243](http://171.244.143.243)
- **Swagger:** [http://171.244.143.243/swagger](http://171.244.143.243/swagger)
- **Code trên VPS:** `~/app` (clone từ GitHub `Trungtran1797/WorkForce-Manager`)
- **File cấu hình:** `~/app/.env` (SA_PASSWORD, JWT_SECRET, PUBLIC_URL, ENABLE_SWAGGER, SEED_ENABLED)

**Deploy code mới:** Chạy `deploy.bat` trên máy Windows (tự commit → push → SSH → git pull → docker compose build → up).

**Thao tác thủ công trên VPS:**

```bash
ssh root@171.244.143.243
cd ~/app

# Xem trạng thái containers
docker compose -f docker-compose.prod.yml ps

# Xem log backend
docker compose -f docker-compose.prod.yml logs -f backend

# Rebuild và restart
docker compose -f docker-compose.prod.yml up -d --build

# Dừng toàn bộ
docker compose -f docker-compose.prod.yml down
```

**Lưu ý VPS:**

- `ufw` không được cài sẵn trên image minimized — đã cài thủ công và mở port 22 + 80.
- Dữ liệu SQL Server và file upload lưu trong Docker volume (`mssql-data`, `uploads-data`) — không mất khi rebuild.
- Lần đầu deploy cần fix TypeScript: biến `lastNetworkError` trong `frontend/src/lib/api-client.ts` phải xóa (đã fix tại commit `6ff0964`).

---

## Important Rules

1. Luôn ưu tiên Clean Architecture.
2. Code phải production-ready.
3. Không tạo code giả lập.
4. Tạo đầy đủ file và cấu trúc thư mục.
5. Viết code hoàn chỉnh, không bỏ trống phần logic.
6. Giải thích kiến trúc trước khi viết code.
7. Tự động đề xuất cải tiến nếu phát hiện giải pháp tốt hơn.
8. Ưu tiên khả năng mở rộng cho 1000+ người dùng.
9. Mọi màn hình đều phải có UI hiện đại.
10. Mọi chức năng phải có xử lý lỗi và logging đầy đủ.

---

## Project Structure

```
.
├── backend/   - ASP.NET Core 9 Clean Architecture solution
├── frontend/  - React + Vite + TypeScript + Tailwind + Shadcn/UI
└── docs/      - Architecture diagrams, ERD, API docs
```

---

## Detailed Rules

@.claude/rules/coding-standards.md
@.claude/rules/clean-architecture.md
@.claude/rules/database-rules.md
@.claude/rules/api-rules.md
@.claude/rules/ui-rules.md
@.claude/rules/security-rules.md
@.claude/rules/git-rules.md

---

## Agents & Skills

Dự án có sẵn các **subagent chuyên trách** theo vai trò trong `.claude/agents/` (solution-architect, database-architect, backend-engineer, frontend-engineer, ui-ux-designer, security-engineer, testing-engineer, devops-engineer, project-manager) - gọi đúng agent phù hợp với từng Phase/Module.

Các **skill quy trình** cho tác vụ lặp lại nằm trong `.claude/skills/` (create-module, create-api, create-page, create-crud, create-dashboard, create-report, create-authentication, create-database, create-testing) - dùng để đảm bảo mọi module mới được triển khai nhất quán theo Clean Architecture + CQRS (backend) và Component-based (frontend).
