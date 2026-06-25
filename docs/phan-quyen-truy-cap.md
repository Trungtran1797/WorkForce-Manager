# Bảng phân quyền truy cập ứng dụng — WorkForce Manager

Tài liệu này mô tả ma trận phân quyền truy cập theo **Vai trò (Role)** và bổ sung **theo Phòng ban đặc thù**, dùng làm spec thiết kế cho việc triển khai phân quyền chi tiết (một số phần đã có trong code, một số phần là đề xuất mở rộng — xem cột "Trạng thái").

Chú giải mức quyền:
- **Chỉnh sửa**: được Thêm/Sửa/Xóa (CRUD đầy đủ hoặc theo phạm vi ghi rõ)
- **Chỉ xem**: chỉ đọc, không có nút thao tác
- **Không truy cập**: không thấy module/menu, API trả 403 nếu cố truy cập

---

## 1. Ma trận theo Vai trò (Role x Module)

| Module | Super Admin | Manager | Employee |
|---|---|---|---|
| Dashboard | Chỉ xem (toàn hệ thống) | Chỉ xem (phòng ban/dự án quản lý) | Chỉ xem (cá nhân) |
| Quản lý Nhân viên (Employees) | Chỉnh sửa | Chỉnh sửa *(đề xuất: giới hạn trong phòng ban quản lý)* | Chỉ xem (hồ sơ cá nhân) |
| Quản lý Phòng ban (Departments) | Chỉnh sửa | Chỉ xem | Không truy cập |
| Dự án (Projects) | Chỉnh sửa | Chỉnh sửa | Chỉ xem (dự án mình tham gia) |
| Công việc (Tasks / Kanban / Calendar / Gantt) | Chỉnh sửa | Chỉnh sửa | Chỉnh sửa (chỉ công việc mình là người thực hiện/người giao) |
| Chấm công (Attendance) | Chỉnh sửa (toàn hệ thống) | Chỉnh sửa (phòng ban quản lý) | Chỉnh sửa (chỉ check-in/out cá nhân) |
| Nghỉ phép (Leave) | Chỉnh sửa (duyệt cấp HR) | Chỉnh sửa (duyệt cấp quản lý) | Chỉnh sửa (đăng ký cá nhân) |
| Tăng ca (Overtime) | Chỉnh sửa (duyệt) | Chỉnh sửa (duyệt phòng ban) | Chỉnh sửa (đăng ký cá nhân) |
| Ca làm việc (Shifts) | Chỉnh sửa | Chỉ xem | Chỉ xem |
| Địa điểm chấm công (Office Locations) | Chỉnh sửa | Chỉ xem | Không truy cập |
| Hợp đồng (Contracts) | Chỉnh sửa | Chỉ xem *(đề xuất: chỉ phòng ban quản lý)* | Chỉ xem (hợp đồng cá nhân) |
| Bảng lương (Payroll) | Chỉnh sửa | Không truy cập | Không truy cập |
| Cấu hình lương (Salary Configs) | Chỉnh sửa | Không truy cập | Không truy cập |
| Phiếu lương cá nhân (My Payslips) | Chỉ xem (toàn bộ) | Chỉ xem (cá nhân) | Chỉ xem (cá nhân) |
| OKRs | Chỉnh sửa | Chỉnh sửa | Chỉnh sửa (mục tiêu cá nhân), Chỉ xem (mục tiêu người khác) |
| Đánh giá hiệu suất (Performance) | Chỉnh sửa | Chỉnh sửa (đánh giá nhân viên thuộc quyền) | Chỉnh sửa (tự đánh giá), Chỉ xem (kết quả) |
| Đào tạo (Training) | Chỉnh sửa | Chỉnh sửa | Chỉ xem + đăng ký |
| Báo cáo (Reports) | Chỉnh sửa (xuất toàn bộ Excel/PDF) | Chỉ xem (báo cáo phòng ban/dự án) | Không truy cập |
| Thông báo (Notifications) | Chỉnh sửa (cá nhân) | Chỉnh sửa (cá nhân) | Chỉnh sửa (cá nhân) |

---

## 2. Quyền bổ sung theo Phòng ban đặc thù

Cấu trúc phòng ban hiện tại: **2 khối** (Văn phòng, Nhà máy), mỗi khối có các phòng con qua `ParentDepartmentId`.

| Khối / Phòng ban | Module bổ sung | Quyền | Ghi chú / Lý do |
|---|---|---|---|
| **Ban giám đốc** (Văn phòng & Nhà máy) | Dashboard, Reports | Chỉ xem toàn hệ thống (mọi phòng ban/dự án) | Giám sát tổng thể, không giới hạn theo phòng như Manager thường |
| **Phòng HCNS - Tổng hợp** | Employees, Departments, Contracts, Leave (bước duyệt HR) | Chỉnh sửa toàn hệ thống | Là phòng đầu mối quản lý hồ sơ nhân sự, hợp đồng và bước duyệt nghỉ phép cuối (HR Approval) cho mọi phòng ban khác |
| **Phòng Kế toán** | Payroll, Salary Configs, Contracts (thông tin lương), Reports (chấm công/lương) | Chỉnh sửa | Phụ trách tính lương tháng, cấu hình thuế/bảo hiểm/phụ cấp, xuất báo cáo tài chính |
| **Phòng Kinh doanh** | Projects, Reports (tiến độ dự án/doanh số) | Chỉnh sửa | Khởi tạo và theo dõi dự án liên quan khách hàng |
| **Phòng Logistics** | Tasks (quy trình xuất hàng), Office Locations | Chỉnh sửa | Quản lý điểm chấm công GPS tại kho/cảng và công việc logistics liên phòng |
| **Kho - Tổng hợp / QA-QC / Sản xuất** (Nhà máy) | Tasks (theo dây chuyền), Shifts (ca kíp/ca đêm) | Chỉnh sửa | Trực tiếp vận hành sản xuất theo ca, cần chỉnh sửa công việc và đăng ký ca |

---

## 3. Trạng thái triển khai trong code

| Cơ chế | Hiện tại | Việc cần làm để khớp bảng trên |
|---|---|---|
| Phân quyền theo Role (`AuthorizationPolicies.cs`) | ✅ Đã có 8 policy (CanManageEmployees, CanManageProjects, CanManagePayroll...) | Giữ nguyên — là nền cho ma trận Mục 1 |
| Phân quyền theo Task (Assignee/Assigner) | ✅ Đã có (`TaskPermission.cs`, `permissions.ts`) | Giữ nguyên |
| JWT chứa `DepartmentId` của user | ✅ Đã có claim, chưa dùng để giới hạn | Cần dùng trong các Query Handler (Employees, Projects, Contracts, Reports) để Manager chỉ thấy dữ liệu phòng mình |
| Phân quyền đặc thù theo Phòng ban (Mục 2) | ❌ Chưa có | Cần thêm policy `CanManageHrData`, `CanManagePayrollDept`, v.v. hoặc kiểm tra `DepartmentId`/`DepartmentCode` trong handler tương ứng |
| Sidebar hiển thị menu theo phòng ban | ❌ Chưa có (chỉ theo Role) | Cần đọc `departmentId`/tên phòng từ JWT để ẩn/hiện thêm menu (vd. Payroll cho Phòng Kế toán) |
