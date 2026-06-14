using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class OkrObjectiveConfiguration : IEntityTypeConfiguration<OkrObjective>
{
    public void Configure(EntityTypeBuilder<OkrObjective> builder)
    {
        builder.ToTable("OkrObjectives");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.Title).IsRequired().HasMaxLength(200);
        builder.Property(o => o.Description).HasMaxLength(1000);
        builder.Property(o => o.OwnerType).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.Period).IsRequired().HasMaxLength(10);

        builder.HasOne(o => o.Department)
            .WithMany()
            .HasForeignKey(o => o.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Employee)
            .WithMany()
            .HasForeignKey(o => o.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.KeyResults)
            .WithOne(k => k.Objective)
            .HasForeignKey(k => k.ObjectiveId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(o => o.Period);
    }
}

public class KeyResultConfiguration : IEntityTypeConfiguration<KeyResult>
{
    public void Configure(EntityTypeBuilder<KeyResult> builder)
    {
        builder.ToTable("KeyResults");
        builder.HasKey(k => k.Id);

        builder.Property(k => k.Title).IsRequired().HasMaxLength(200);
        builder.Property(k => k.Unit).HasMaxLength(50);
        builder.Property(k => k.TargetValue).HasColumnType("decimal(18,2)");
        builder.Property(k => k.CurrentValue).HasColumnType("decimal(18,2)");
        builder.Property(k => k.Weight).HasColumnType("decimal(5,2)");
    }
}
