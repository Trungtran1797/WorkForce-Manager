using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class ShiftAssignmentConfiguration : IEntityTypeConfiguration<ShiftAssignment>
{
    public void Configure(EntityTypeBuilder<ShiftAssignment> builder)
    {
        builder.ToTable("ShiftAssignments");
        builder.HasKey(sa => sa.Id);

        builder.Property(sa => sa.Note).HasMaxLength(500);

        builder.HasOne(sa => sa.Employee)
            .WithMany()
            .HasForeignKey(sa => sa.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(sa => sa.Shift)
            .WithMany(s => s.Assignments)
            .HasForeignKey(sa => sa.ShiftId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(sa => new { sa.EmployeeId, sa.WorkDate });
    }
}
