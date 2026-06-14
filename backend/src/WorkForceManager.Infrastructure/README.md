# WorkForceManager.Infrastructure

Infrastructure layer (Phase 1-2):

- EF Core `DbContext` + Migrations (Code First, SQL Server)
- Repository implementations + Unit of Work
- Identity / JWT token services
- SignalR Hubs
- External services (Email, Excel/PDF export, file storage)

Phụ thuộc vào `WorkForceManager.Domain` và `WorkForceManager.Application`.
