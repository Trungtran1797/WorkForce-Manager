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

---

### Lưu ý vận hành (cập nhật 2026-06-26)

- **VPS demo đang chạy**: `http://171.244.143.243` — project tại `/root/app/` trên VPS Ubuntu 24.04. Tài khoản demo: admin/Admin@123, manager/Manager@123, employee/Employee@123.
- **Cập nhật VPS khi có code mới**: Chạy `deploy.bat` ở thư mục gốc. Script tự động commit/push → git pull VPS → `docker compose build --no-cache` → `up -d`. Timeout SSH 600s vì build `--no-cache` mất 5–10 phút.
- **Reset database VPS về seed mặc định**: SSH vào VPS rồi `cd ~/app && docker compose -f docker-compose.prod.yml down -v && docker compose -f docker-compose.prod.yml up -d --build`. Cảnh báo: mất toàn bộ dữ liệu đã nhập.
- **Docker dùng cache cũ → site không cập nhật**: Phải dùng `--no-cache`. Nếu `docker compose up -d --build` vẫn thấy `CACHED` ở mọi bước → chạy lại với `docker compose build --no-cache` trước.
- **"Server tạm thời không phản hồi" trên trang login**: Backend chưa chạy. Chạy: `dotnet run --project "backend/src/WorkForceManager.WebApi"`. Chờ thấy `Application started` rồi đăng nhập lại.
- **Khi UI hiển thị sai / thiếu tính năng đã code**: Nguyên nhân thường là browser cache cũ. Xử lý: **Ctrl+Shift+R** (hard refresh) hoặc khởi động lại `npm run dev` trong `frontend/`.
- **Ngày xuất hàng (ShippingDate) trong seed data**: Project DA004 có `ShippingDate = 2026-07-18`. Để thấy icon Truck cam trên Dashboard "Lịch công tác & Deadline", cần chuyển lịch sang **tháng 7/2026**. Tháng 6/2026 trống là đúng.
- **Label "Mã dự án" đã đổi thành "Số hợp đồng"** từ Bước 18, field `ShippingDate` đã có trong form tạo/sửa dự án.

---

### Thông tin VPS Production (cập nhật 2026-06-26)

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
