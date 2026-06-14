# Coding Standards

## Frontend (React + TypeScript)

- **Component-Based Architecture**: mỗi UI element là 1 component độc lập, đặt trong `src/components/` (shared/UI) hoặc `src/features/<module>/components/` (đặc thù module).
- **Reusable Components**: ưu tiên tái sử dụng component có sẵn từ `src/components/ui/` (Shadcn/UI) trước khi tạo mới. Component dùng chung ≥ 2 nơi → đưa vào `src/components/`.
- **Clean Code**:
  - Tên file: `PascalCase.tsx` cho component, `camelCase.ts` cho hooks/utils.
  - Tên component, type, interface: `PascalCase`. Biến, hàm: `camelCase`. Hằng số: `UPPER_SNAKE_CASE`.
  - Mỗi component chỉ làm một việc (Single Responsibility). Tách logic phức tạp ra custom hook (`useXxx`).
  - Không để code chết (dead code), không `console.log` trong code production.
- **TypeScript Strict Mode**:
  - `tsconfig.json` luôn bật `"strict": true`.
  - Không dùng `any`. Dùng `unknown` + type guard khi cần.
  - Định nghĩa `interface`/`type` cho mọi DTO, props, API response trong `src/types/`.
- **Cấu trúc theo feature** (feature-based folder):
  ```
  src/features/<module>/
  ├── components/   - component riêng của module
  ├── hooks/        - custom hooks
  ├── api/          - API calls (React Query/axios)
  ├── types/        - types riêng module
  └── pages/        - page-level components
  ```
- **State Management**: server state dùng React Query (TanStack Query), client/UI state dùng React state hoặc Zustand nếu cần global state.
- **Styling**: chỉ dùng Tailwind utility classes + component variants từ Shadcn/UI (`cva`). Không viết CSS thủ công trừ khi thật cần thiết (animation phức tạp).

## Backend (C# / ASP.NET Core)

- **Naming Conventions**:
  - `PascalCase` cho class, method, property, interface (interface có tiền tố `I`, ví dụ `IEmployeeRepository`).
  - `camelCase` cho local variable, parameter. `_camelCase` cho private field.
  - Async method luôn có hậu tố `Async` (ví dụ `GetByIdAsync`).
- **Nullable Reference Types**: bật `<Nullable>enable</Nullable>` ở mọi project, xử lý rõ ràng giá trị `null`.
- **Async/Await**: mọi I/O (DB, file, HTTP) đều dùng `async/await`, truyền `CancellationToken` xuyên suốt từ Controller → Handler → Repository.
- **Dependency Injection**: không dùng `static` cho service có state hoặc cần test; đăng ký service qua DI container theo lifetime phù hợp (Scoped cho DbContext/Repository, Singleton cho config/cache).
- **Clean Code**:
  - Method ngắn, đơn nhiệm. Không nested quá 2-3 cấp `if/for`.
  - Không hard-code chuỗi/số magic - đưa vào constant hoặc configuration.
  - Comment chỉ giải thích "tại sao", không giải thích "làm gì" (code phải tự giải thích qua naming).
- **Error Handling & Logging**: mọi action phải có try/catch ở boundary (middleware) + logging có cấu trúc (Serilog) với context (UserId, RequestId, Module).

## Áp dụng chung

- Mọi tính năng mới phải tuân theo [`clean-architecture.md`](./clean-architecture.md), [`api-rules.md`](./api-rules.md), [`ui-rules.md`](./ui-rules.md) tương ứng.
- Không tạo code giả lập/mock trong nhánh production code (xem `CLAUDE.md` → Important Rules).
