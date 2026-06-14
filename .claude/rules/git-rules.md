# Git Rules

## Branch Naming

```
main                    - production-ready code
develop                 - integration branch
feature/<phase>-<ten>   - tính năng mới (vd. feature/phase7-employee-crud)
fix/<ten-bug>           - sửa bug (vd. fix/leave-approval-status)
chore/<ten>             - cấu hình, tooling, docs (vd. chore/setup-eslint)
```

## Commit Message (Conventional Commits)

```
<type>(<scope>): <mô tả ngắn>

[mô tả chi tiết - optional]
```

- `type`: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`.
- `scope`: tên module/layer (vd. `employee`, `auth`, `api`, `ui`, `db`).

Ví dụ:

```
feat(employee): add CRUD API for employee management
fix(auth): refresh token not rotated on use
refactor(task): extract TaskStatus enum to Domain
docs(claude): update CLAUDE.md with rules import
```

## Pull Request Checklist

Trước khi mở PR, đảm bảo:

- [ ] Code build thành công (backend `dotnet build`, frontend `npm run build`).
- [ ] Tuân theo [`coding-standards.md`](./coding-standards.md) và [`clean-architecture.md`](./clean-architecture.md).
- [ ] API mới tuân theo [`api-rules.md`](./api-rules.md) (response envelope, validation, pagination).
- [ ] UI mới tuân theo [`ui-rules.md`](./ui-rules.md) (responsive, dark/light, loading/empty/error state).
- [ ] Thay đổi DB có migration tương ứng, tuân theo [`database-rules.md`](./database-rules.md) (soft delete, audit log).
- [ ] Endpoint/role mới tuân theo [`security-rules.md`](./security-rules.md) (authorization, validation).
- [ ] Có test cho logic mới (xem skill [`create-testing`](../skills/create-testing/SKILL.md)) nếu thuộc Phase ≥ 11 hoặc theo yêu cầu cụ thể.
- [ ] Không còn code mock/giả lập, TODO bỏ trống logic.

## Quy ước theo Phase

Mỗi commit/PR nên gắn với 1 Phase trong roadmap (`CLAUDE.md` → Deliverables) để dễ theo dõi tiến độ - ví dụ `feature/phase3-backend-api`, `feature/phase6-dashboard`.
