---
name: create-page
description: Tạo một page React mới (route-level) cho WorkForce Manager với layout, component composition, kết nối API và đầy đủ trạng thái UI (loading/empty/error), responsive, dark/light mode. Dùng khi cần thêm 1 màn hình mới vào frontend.
---

# Create Page (React + Vite + Shadcn/UI)

Tuân theo `.claude/rules/ui-rules.md` và `.claude/rules/coding-standards.md`.

## Bước 1 - Vị trí & Routing

1. Tạo file tại `src/features/<module>/pages/<TenPage>Page.tsx`.
2. Thêm route trong router config (vd. `src/routes/index.tsx`), bọc trong layout chính (App Shell: sidebar + header).
3. Thêm `ProtectedRoute` với role được phép truy cập (`.claude/rules/security-rules.md`).
4. Thêm menu item vào Sidebar (icon Lucide phù hợp + label), chỉ hiển thị với role tương ứng.

## Bước 2 - Data Fetching

1. Tạo/dùng lại hook React Query trong `src/features/<module>/api/` (vd. `useGetEmployees(params)`).
2. Xử lý 3 trạng thái: `isLoading` → skeleton, `isError` → error state + nút retry, `data.length === 0` → empty state (message + CTA nếu có).

## Bước 3 - Layout & Components

1. Bố cục theo pattern trong `.claude/rules/ui-rules.md` (header page có title + action buttons bên phải; content dùng Card/Table/Grid).
2. Ưu tiên tái sử dụng từ `src/components/ui/` (Table, Card, Badge, Button, Dialog...).
3. Component đặc thù page → đặt trong `src/features/<module>/components/`.

## Bước 4 - Responsive & Theme

1. Kiểm tra layout ở breakpoint `sm`, `md`, `lg`, `xl`.
2. Test cả Light và Dark mode - đảm bảo contrast đủ, không có màu hardcode (dùng token/biến theme).

## Bước 5 - Kiểm tra cuối

- `npm run build` không lỗi TypeScript.
- Không còn `console.log`/`any`.
- Page hiển thị đúng theo role (test thử với từng role nếu có thể).
