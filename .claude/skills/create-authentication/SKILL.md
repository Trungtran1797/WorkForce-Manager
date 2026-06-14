---
name: create-authentication
description: Thiết lập hoặc mở rộng luồng authentication/authorization của WorkForce Manager - JWT access + refresh token, role claims, endpoint login/refresh/logout/register, và frontend auth context + protected routes. Dùng cho Phase 5 (Authentication) hoặc khi thêm role/permission mới.
---

# Create Authentication (JWT + Refresh Token + RBAC)

Tuân theo `.claude/rules/security-rules.md` và `.claude/rules/clean-architecture.md`.

## Bước 1 - Domain & Database

1. Entity `User` (liên kết với `Employee` nếu cần): `Email`, `PasswordHash`, `Role` (enum: SuperAdmin/Manager/Employee), `RefreshTokens` (navigation).
2. Entity `RefreshToken`: `Token`, `UserId`, `ExpiresAt`, `CreatedAt`, `RevokedAt`, `ReplacedByToken`.
3. Migration cho 2 bảng trên (theo skill `create-database`).

## Bước 2 - Infrastructure

1. `IPasswordHasher`/dùng ASP.NET Identity `PasswordHasher<User>`.
2. `ITokenService`: `GenerateAccessToken(User user)` (JWT với claims `sub`, `email`, `role`), `GenerateRefreshToken()` (random string), `ValidateRefreshToken(...)`.
3. Cấu hình JWT trong `appsettings.json` (Issuer, Audience, SecretKey từ env var, thời hạn access/refresh token) và `AddAuthentication().AddJwtBearer(...)` trong `DependencyInjection.cs`.

## Bước 3 - Application

1. `LoginCommand` (email, password) → verify password → trả `{ accessToken, refreshToken, user }`.
2. `RefreshTokenCommand` (refreshToken) → validate, rotate (revoke cũ, issue mới) → trả token mới.
3. `LogoutCommand` (refreshToken) → revoke token.
4. `RegisterCommand` (chỉ Super Admin gọi được) → tạo `User` mới với role chỉ định.

## Bước 4 - WebApi

1. `AuthController`: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh-token`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/register` (`[Authorize(Roles = "SuperAdmin")]`).
2. Áp dụng Rate Limiting cho `login` và `refresh-token` (`.claude/rules/security-rules.md`).
3. Định nghĩa Authorization Policies trong `AuthorizationPolicies.cs` cho các trường hợp phức tạp hơn role đơn giản (vd. `CanApproveLeaveForDepartment`).

## Bước 5 - Frontend

1. `AuthContext`/`useAuth` hook: lưu `accessToken` (memory) + `refreshToken` (HTTP-only cookie hoặc secure storage), expose `login`, `logout`, `user` (decode từ JWT).
2. Axios/fetch interceptor: tự động gắn `Authorization: Bearer <token>`, khi gặp `401` → gọi refresh-token → retry request gốc; nếu refresh fail → logout + redirect `/login`.
3. `ProtectedRoute` component: kiểm tra `isAuthenticated` + `role` (so với `allowedRoles` của route).
4. Sidebar/menu render theo `user.role`.

## Kiểm tra cuối

- Login đúng/sai mật khẩu trả đúng status (`200`/`401`).
- Access token hết hạn → tự refresh thành công, request tiếp tục bình thường (test bằng cách set thời hạn access token ngắn trong dev).
- Refresh token bị revoke (sau logout) không dùng lại được.
- Mỗi role chỉ truy cập được đúng các route/menu/API theo `CLAUDE.md` → User Roles.
