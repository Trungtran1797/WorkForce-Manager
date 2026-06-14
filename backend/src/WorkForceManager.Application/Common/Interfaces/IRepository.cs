using System.Linq.Expressions;
using WorkForceManager.Domain.Common;

namespace WorkForceManager.Application.Common.Interfaces;

/// <summary>Repository generic cho CRUD cơ bản (write side của Command).</summary>
public interface IRepository<T> where T : BaseAuditableEntity
{
    Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<T>> ListAsync(CancellationToken cancellationToken = default);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    void Update(T entity);
    void Remove(T entity);
    IQueryable<T> Query();
}
