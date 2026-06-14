# Backend - WorkForce Manager

ASP.NET Core 9 solution theo Clean Architecture (CQRS + MediatR + Repository Pattern + Unit of Work).

## Cấu trúc dự kiến (Phase 1)

```
backend/
├── src/
│   ├── WorkForceManager.Domain/          - Entities, Value Objects, Domain Interfaces
│   ├── WorkForceManager.Application/     - CQRS Commands/Queries, MediatR Handlers, DTOs, Validators
│   ├── WorkForceManager.Infrastructure/  - EF Core DbContext, Repositories, External Services
│   └── WorkForceManager.WebApi/          - API Controllers, DI Setup, Middleware, Auth
├── tests/                                 - Unit & Integration Tests (Phase 11)
└── WorkForceManager.sln
```

Solution và project files (`.sln`, `.csproj`) sẽ được tạo bằng `dotnet new` ở Phase 1.
