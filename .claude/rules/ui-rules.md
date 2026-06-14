# UI Rules (React + Tailwind + Shadcn/UI)

## Design Tokens

Định nghĩa trong `tailwind.config.ts` + CSS variables (`src/styles/globals.css`) để hỗ trợ Dark/Light mode:

| Token | Light | Dark | Ý nghĩa |
|---|---|---|---|
| `primary` | `#2563EB` | (giữ hoặc tối hơn nhẹ) | Hành động chính, link, focus ring |
| `success` | `#16A34A` | tương ứng | Trạng thái hoàn thành, thành công |
| `warning` | `#F59E0B` | tương ứng | Sắp đến hạn, cảnh báo |
| `danger` | `#DC2626` | tương ứng | Quá hạn, lỗi, xóa |

- Map các token này vào Shadcn theme (`--primary`, `--destructive`, v.v.) để mọi component (Button, Badge, Alert) tự động dùng đúng màu.
- Trạng thái Task/Project map màu: `Todo` = gray, `In Progress` = primary, `Review` = warning, `Done` = success, `Cancelled`/`Overdue` = danger.

## Component Conventions (Shadcn/UI)

- Luôn ưu tiên dùng/extend component có sẵn trong `src/components/ui/` (Button, Input, Select, Dialog, Table, Card, Badge, Tabs, DropdownMenu...) trước khi viết mới.
- Icon: chỉ dùng **Lucide Icons** (`lucide-react`), kích thước chuẩn `16/20/24px`, đồng bộ `strokeWidth`.
- Form: dùng `react-hook-form` + `zod` resolver + Shadcn `Form` components, validate khớp với Validator phía backend.

## Layout chuẩn (Dashboard App Shell)

```
┌─────────────────────────────────────────┐
│ Header (logo, search, theme toggle,      │
│         notifications, user menu)        │
├───────────┬───────────────────────────────┤
│           │                               │
│  Sidebar  │   Page Content                │
│  (nav theo│   - KPI Cards (grid)          │
│  module + │   - Charts                    │
│  role)    │   - Tables / Kanban / Calendar│
│           │                               │
└───────────┴───────────────────────────────┘
```

- Sidebar menu hiển thị theo **role** (Super Admin thấy toàn bộ module; Manager/Employee theo phân quyền - xem `security-rules.md`).
- KPI Cards: icon + số liệu lớn + label + (tùy chọn) % thay đổi, dùng `Card` của Shadcn.
- Charts: dùng `recharts` (hoặc Shadcn Charts) cho biểu đồ tiến độ/thống kê.

## Responsive

- Breakpoints theo Tailwind mặc định (`sm/md/lg/xl/2xl`).
- Sidebar: thu gọn thành icon-only hoặc drawer (mobile) dưới `lg`.
- Table → chuyển sang dạng card list trên mobile khi cần.

## Dark Mode / Light Mode

- Dùng class-based dark mode (`class="dark"` trên `<html>`), `ThemeProvider` (context) lưu lựa chọn vào `localStorage`.
- Mọi component custom phải có biến thể `dark:` tương ứng - test cả 2 theme trước khi coi là "Done".

## Trạng thái UI bắt buộc cho mọi page/table

- Loading state (skeleton), Empty state (illustration/message + CTA), Error state (message + retry).

## Khi tạo page/component mới

Tham khảo skill [`create-page`](../skills/create-page/SKILL.md).
