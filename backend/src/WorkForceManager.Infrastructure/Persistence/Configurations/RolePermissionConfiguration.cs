using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("RolePermissions");
        builder.HasKey(rp => rp.Id);

        builder.Property(rp => rp.Role).HasConversion<string>().HasMaxLength(20);
        builder.Property(rp => rp.Module).HasConversion<string>().HasMaxLength(30);
        builder.Property(rp => rp.Level).HasConversion<string>().HasMaxLength(10);

        builder.HasIndex(rp => new { rp.Role, rp.Module }).IsUnique();
    }
}
