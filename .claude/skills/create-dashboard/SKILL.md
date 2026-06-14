---
name: create-dashboard
description: Tạo một KPI card hoặc chart mới cho trang Dashboard của WorkForce Manager - bao gồm query thống kê (backend), endpoint, và component hiển thị (KPI card hoặc chart) ở frontend. Dùng khi cần bổ sung số liệu/biểu đồ mới vào Dashboard.
---

# Create Dashboard Widget (KPI Card / Chart)

Tuân theo `.claude/rules/api-rules.md` (Query pattern) và `.claude/rules/ui-rules.md` (Dashboard layout, design tokens).

## Bước 1 - Xác định số liệu cần thiết

Tham khảo `CLAUDE.md` → Dashboard: Tổng số nhân viên, Công việc đang thực hiện, Công việc quá hạn, Công việc hoàn thành, Dự án đang triển khai, Biểu đồ tiến độ.

Xác định: nguồn dữ liệu (entity/table nào), điều kiện tính toán (vd. "quá hạn" = `Deadline < Now && Status != Done/Cancelled`), có cần group theo thời gian/phòng ban/dự án không (cho chart).

## Bước 2 - Backend Query

1. Tạo Query trong `Application/Features/Dashboard/Queries/<TenWidget>/` (vd. `GetTaskStatsQuery`, `GetProjectProgressChartQuery`).
2. Dùng `AsNoTracking()`, group/aggregate trực tiếp trong query EF Core (tránh load toàn bộ data về memory).
3. Trả DTO gọn (số liệu cho KPI card, hoặc array điểm dữ liệu `{ label, value }` cho chart).
4. Thêm endpoint trong `DashboardController` (vd. `GET /api/v1/dashboard/task-stats`, `GET /api/v1/dashboard/project-progress`).

## Bước 3 - Frontend Component

- **KPI Card**: dùng `Card` (Shadcn) + icon Lucide phù hợp + số liệu lớn + label. Màu icon/accent theo ý nghĩa (vd. "Quá hạn" → `danger`, "Hoàn thành" → `success`) theo `.claude/rules/ui-rules.md`.
- **Chart**: dùng `recharts` (LineChart/BarChart/PieChart tùy loại dữ liệu), responsive container, tooltip, màu theo design tokens.
- Đặt component trong `src/features/dashboard/components/`, fetch qua React Query hook riêng.
- Thêm vào layout Dashboard page (`DashboardPage.tsx`) ở vị trí phù hợp (grid KPI cards ở trên, charts/recent activities ở dưới).

## Bước 4 - Kiểm tra

- Số liệu khớp với dữ liệu thực tế trong DB (kiểm tra vài trường hợp biên: 0 task, task quá hạn đúng theo timezone).
- Loading state cho widget (skeleton riêng, không block toàn page).
- Responsive: KPI cards xếp dạng grid co giãn theo màn hình; chart không vỡ layout trên mobile.
