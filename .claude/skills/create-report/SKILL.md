---
name: create-report
description: Tạo một báo cáo xuất Excel hoặc PDF cho WorkForce Manager (hiệu suất nhân viên, tiến độ dự án, tỷ lệ hoàn thành công việc, thống kê phòng ban, báo cáo chấm công...) - bao gồm query dữ liệu, generate file, endpoint download và nút export ở frontend. Dùng cho module Reports và chức năng Export Excel của Employee Management.
---

# Create Report (Excel / PDF Export)

Tuân theo `.claude/rules/api-rules.md` và `.claude/rules/clean-architecture.md`.

## Bước 1 - Xác định loại báo cáo & dữ liệu

Tham khảo `CLAUDE.md` → Reports: Hiệu suất nhân viên, Tiến độ dự án, Tỷ lệ hoàn thành công việc, Thống kê phòng ban, Báo cáo chấm công. Xác định:

- Tham số đầu vào (khoảng thời gian, phòng ban, dự án...).
- Các cột/section cần hiển thị trong file output.

## Bước 2 - Application Layer

1. Tạo Query (vd. `GetEmployeePerformanceReportQuery`) trả về DTO chứa dữ liệu đã tổng hợp (đừng để logic format file ở Application).
2. Tạo service interface `IExcelExportService` / `IPdfExportService` (nếu chưa có) trong `Application/Common/Interfaces/`.

## Bước 3 - Infrastructure Layer

1. Implement `ExcelExportService` (dùng **ClosedXML**) và/hoặc `PdfExportService` (dùng **QuestPDF**) trong `Infrastructure/Services/`.
2. Mỗi report có 1 method tạo file từ DTO (vd. `GenerateEmployeePerformanceExcel(IEnumerable<EmployeePerformanceDto> data)` trả về `byte[]`/`Stream`).
3. Format file: header rõ ràng, định dạng số/ngày tháng phù hợp, áp dụng style cơ bản (header bold, border) cho Excel.

## Bước 4 - WebApi Layer

- Endpoint dạng: `GET /api/v1/reports/employee-performance/export?format=excel&from=...&to=...`
- Trả `FileContentResult` với `Content-Type` đúng (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` cho Excel, `application/pdf` cho PDF) và `Content-Disposition: attachment; filename=...`.
- Áp `[Authorize]` theo role được phép xem báo cáo (Super Admin toàn hệ thống; Manager theo phòng/dự án mình quản lý - `CLAUDE.md` → User Roles).

## Bước 5 - Frontend

1. Trang Reports (`src/features/reports/pages/ReportsPage.tsx`): chọn loại báo cáo + filter (thời gian, phòng ban...).
2. Nút "Export Excel"/"Export PDF" gọi endpoint, nhận blob response, trigger download (`URL.createObjectURL` + `<a download>`).
3. Hiển thị loading state trong lúc generate file (có thể mất vài giây với data lớn).

## Kiểm tra cuối

- File mở được đúng định dạng, dữ liệu khớp filter đã chọn.
- Với data rỗng, vẫn xuất được file hợp lệ (có header, không lỗi).
- Endpoint chịu được data lớn (kiểm tra với vài trăm/nghìn dòng) - cân nhắc streaming nếu cần.
