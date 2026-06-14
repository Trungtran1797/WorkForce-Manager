using WorkForceManager.Domain.Common;

namespace WorkForceManager.Application.Common.Interfaces;

/// <summary>
/// Transaction boundary = 1 Command. Truy cập repository generic và commit 1 lần ở cuối handler.
/// </summary>
public interface IUnitOfWork
{
    IRepository<T> Repository<T>() where T : BaseAuditableEntity;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
