using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class DepartmentPermissionOverrideConfiguration : IEntityTypeConfiguration<DepartmentPermissionOverride>
{
    public void Configure(EntityTypeBuilder<DepartmentPermissionOverride> builder)
    {
        builder.ToTable("DepartmentPermissionOverrides");
        builder.HasKey(dpo => dpo.Id);

        builder.Property(dpo => dpo.Module).HasConversion<string>().HasMaxLength(30);
        builder.Property(dpo => dpo.Level).HasConversion<string>().HasMaxLength(10);

        builder.HasOne(dpo => dpo.Department)
            .WithMany()
            .HasForeignKey(dpo => dpo.DepartmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(dpo => new { dpo.DepartmentId, dpo.Module }).IsUnique();
    }
}
