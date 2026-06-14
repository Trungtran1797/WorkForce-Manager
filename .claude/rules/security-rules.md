# Security Rules

## JWT Authentication & Refresh Token

- **Access Token**: JWT, thời hạn ngắn (vd. 15 phút), chứa claims: `sub` (UserId), `email`, `role`, `departmentId` (nếu cần cho filter dữ liệu).
- **Refresh Token**: random string lưu trong DB (bảng `RefreshTokens`: Token, UserId, ExpiresAt, RevokedAt, ReplacedByToken), thời hạn dài hơn (vd. 7 ngày), gửi qua HTTP-only cookie hoặc body (tùy yêu cầu client).
- Endpoint: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh-token`, `POST /api/v1/auth/logout` (revoke refresh token), `POST /api/v1/auth/register` (Super Admin tạo user).
- Khi access token hết hạn, frontend gọi `refresh-token` tự động (interceptor axios/fetch) - nếu refresh cũng fail → redirect login.

## Password Hashing

- Dùng ASP.NET Core Identity `PasswordHasher<T>` (PBKDF2) hoặc BCrypt - **không** lưu plain text hoặc tự viết hash.
- Policy mật khẩu tối thiểu: ≥ 8 ký tự, có chữ hoa/thường/số (cấu hình qua Identity options).

## Role-Based Permission

3 role chính (xem `CLAUDE.md` → User Roles): **Super Admin**, **Manager**, **Employee**.

- Implement qua ASP.NET Core `[Authorize(Roles = "...")]` hoặc Policy-based authorization (`[Authorize(Policy = "CanManageProjects")]`) cho rule phức tạp hơn (vd. Manager chỉ duyệt nghỉ phép của nhân viên thuộc phòng mình quản lý).
- Định nghĩa policy tập trung trong `Infrastructure/Identity/AuthorizationPolicies.cs`.
- Frontend: route guard theo role (`ProtectedRoute` component), ẩn/hiện menu + action button theo role lấy từ JWT claims (không chỉ ẩn UI - backend luôn validate lại).

## API Validation

- Validate input ở Application layer (FluentValidation) - không tin dữ liệu từ client (kể cả `id` trong route phải kiểm tra quyền truy cập resource đó).
- Chống injection: dùng EF Core parameterized queries (mặc định an toàn), không string-concat SQL.
- Sanitize input hiển thị lại trên UI (tránh XSS) - React tự escape, nhưng cẩn trọng với `dangerouslySetInnerHTML`.

## Rate Limiting

- Áp dụng cho `/auth/login`, `/auth/refresh-token` (chống brute-force, vd. 5 lần/phút/IP).
- Rate limit chung cho toàn API theo user/IP (vd. 100 requests/phút) - trả `429 Too Many Requests`.

## Audit & Logging cho Security Events

- Log các event: login thành công/thất bại, đổi mật khẩu, thay đổi role/permission, duyệt/từ chối nghỉ phép - ghi vào `AuditLogs` (xem [`database-rules.md`](./database-rules.md)) với `UserId`, `IPAddress`, `Timestamp`.
- Không log thông tin nhạy cảm (password, token) ra log file.

## Khi triển khai authentication

Tham khảo skill [`create-authentication`](../skills/create-authentication/SKILL.md).
