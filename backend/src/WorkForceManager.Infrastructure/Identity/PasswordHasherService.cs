using Microsoft.AspNetCore.Identity;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Infrastructure.Identity;

/// <summary>Bọc PasswordHasher (PBKDF2) của ASP.NET Core Identity.</summary>
public class PasswordHasherService : IPasswordHasher
{
    private readonly PasswordHasher<object> _hasher = new();
    private static readonly object Dummy = new();

    public string Hash(string password) => _hasher.HashPassword(Dummy, password);

    public bool Verify(string hashedPassword, string providedPassword)
    {
        var result = _hasher.VerifyHashedPassword(Dummy, hashedPassword, providedPassword);
        return result is PasswordVerificationResult.Success
            or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
