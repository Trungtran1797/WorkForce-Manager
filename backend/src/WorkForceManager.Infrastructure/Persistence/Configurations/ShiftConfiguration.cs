using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class ShiftConfiguration : IEntityTypeConfiguration<Shift>
{
    public void Configure(EntityTypeBuilder<Shift> builder)
    {
        builder.ToTable("Shifts");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Code).IsRequired().HasMaxLength(30);
        builder.Property(s => s.Name).IsRequired().HasMaxLength(100);
        builder.Property(s => s.ShiftType).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(s => s.Code).IsUnique();
    }
}
