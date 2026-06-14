# Frontend - WorkForce Manager

React + Vite + TypeScript + Tailwind CSS v4 + Shadcn/UI + Lucide Icons.

> **Phase 0 - UI Preview**: toàn bộ dữ liệu trong các trang hiện là **mock data** (xem `src/features/<module>/data/`). Chưa kết nối API backend thật - sẽ được tích hợp ở các Phase tiếp theo (Phase 5+).

## Cấu trúc dự án

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/         - Shadcn/UI primitives (Button, Input, Dialog, Table, ...)
│   │   ├── common/      - Component dùng chung (status badges, loading/empty/error state)
│   │   └── theme/        - ThemeProvider + ThemeToggle (dark/light, lưu localStorage)
│   ├── features/
│   │   ├── auth/         - Login page
│   │   ├── dashboard/     - KPI cards, chart tiến độ, recent activities
│   │   ├── employees/     - Employee list/CRUD (mock), Import/Export Excel (UI only)
│   │   ├── departments/   - Department list/CRUD (mock)
│   │   ├── projects/      - Project list + detail (gán nhân sự, tiến độ)
│   │   ├── tasks/          - Task List/Kanban (dnd-kit)/Calendar/Gantt (custom)
│   │   ├── attendance/     - Check In/Out, bảng chấm công
│   │   ├── leave/          - Đăng ký & duyệt nghỉ phép
│   │   └── reports/        - Danh sách báo cáo, export Excel/PDF (UI only)
│   ├── layouts/         - AppShell, Header, Sidebar (responsive, role menu)
│   ├── lib/              - utils (cn), formatters
│   ├── stores/           - Zustand store (sidebar collapse/mobile drawer)
│   ├── styles/           - globals.css (Tailwind v4 theme tokens, dark/light)
│   ├── types/            - Shared types (TaskStatus, ProjectStatus, ...)
│   ├── App.tsx           - Router + Providers (React Query, ThemeProvider)
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig*.json
```

## Scripts

```bash
npm run dev      # chạy dev server (http://localhost:5173)
npm run build    # type-check (tsc -b) + build production
npm run lint     # eslint
npm run preview  # preview bản build
```

## Design tokens

Định nghĩa trong `src/styles/globals.css` (CSS variables + `@theme inline` cho Tailwind v4):
primary `#2563EB`, success `#16A34A`, warning `#F59E0B`, danger/destructive `#DC2626`,
hỗ trợ dark mode class-based (`.dark` trên `<html>`).
