# WorkForceManager.WebApi

API layer (Phase 1, 3, 5):

- API Controllers (REST endpoints per module)
- Dependency Injection setup (`Program.cs`)
- Middleware (error handling, logging, rate limiting)
- Authentication/Authorization (JWT, Refresh Token, Role-based policies)
- SignalR hub registration
- Swagger/OpenAPI configuration

Phụ thuộc vào `WorkForceManager.Application` và `WorkForceManager.Infrastructure`.
