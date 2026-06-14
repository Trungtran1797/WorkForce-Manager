# API Rules (ASP.NET Core Web API)

## Routing & Versioning

- Route convention: `api/v{version}/<resource-plural>` (vd. `api/v1/employees`, `api/v1/projects/{id}/tasks`).
- Controller đặt theo module (`EmployeesController`, `ProjectsController`, `TasksController`...), kế thừa `ApiControllerBase` (chứa `ISender`/`IMediator`).
- HTTP verbs chuẩn REST:
  - `GET /resource` - list (có filter/pagination/sort)
  - `GET /resource/{id}` - detail
  - `POST /resource` - create
  - `PUT /resource/{id}` - update toàn bộ
  - `PATCH /resource/{id}` - update phần (vd. đổi trạng thái Task)
  - `DELETE /resource/{id}` - soft delete

## Response Envelope

Mọi response trả về theo format chuẩn:

```json
{
  "success": true,
  "data": { },
  "message": "string | null",
  "errors": null
}
```

Khi lỗi:

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": {
    "FieldName": ["error message"]
  }
}
```

- Implement qua `ApiResponse<T>` wrapper (Application/Common) + `ExceptionHandlingMiddleware` (WebApi) bắt mọi exception và map sang format trên.
- Mã lỗi HTTP chuẩn: `400` validation, `401` unauthenticated, `403` forbidden (role permission), `404` not found, `409` conflict, `429` rate limit, `500` unexpected.

## Validation

- Mọi Command/Query có `Validator` (FluentValidation), chạy qua `ValidationBehavior` trong MediatR pipeline (xem [`clean-architecture.md`](./clean-architecture.md)).
- Validate cả ở Domain (business rules, vd. ngày kết thúc dự án > ngày bắt đầu) và Application (input format, required fields).

## Pagination, Filter, Sort

Query list dùng chung format request:

```
GET /api/v1/employees?pageNumber=1&pageSize=20&search=&sortBy=createdDate&sortDirection=desc&departmentId=&status=
```

Response list:

```json
{
  "success": true,
  "data": {
    "items": [ ],
    "pageNumber": 1,
    "pageSize": 20,
    "totalCount": 120,
    "totalPages": 6
  }
}
```

- Implement `PaginatedList<T>` chung trong `Application/Common/Models/`.

## Exception Handling & Logging

- `ExceptionHandlingMiddleware` (đăng ký đầu tiên trong pipeline) bắt:
  - `ValidationException` → 400
  - `NotFoundException` → 404
  - `ForbiddenAccessException` → 403
  - `UnauthorizedAccessException` → 401
  - Exception khác → 500 (log đầy đủ stack trace, trả message generic cho client)
- Mọi request log qua Serilog: method, path, status code, thời gian xử lý, UserId (nếu có).

## Rate Limiting

- Áp dụng `AspNetCore RateLimiter` (built-in .NET) cho các endpoint nhạy cảm: `/auth/login`, `/auth/refresh-token` (chống brute-force), và giới hạn chung theo IP/user cho toàn API.

## Khi tạo endpoint mới

Tham khảo skill [`create-api`](../skills/create-api/SKILL.md).
