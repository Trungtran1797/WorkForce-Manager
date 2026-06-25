using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class OvertimeRequestConfiguration : IEntityTypeConfiguration<OvertimeRequest>
{
    public void Configure(EntityTypeBuilder<OvertimeRequest> builder)
    {
        builder.ToTable("OvertimeRequests");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.Hours).HasColumnType("decimal(5,2)");
        builder.Property(o => o.Reason).HasMaxLength(500);
        builder.Property(o => o.RejectReason).HasMaxLength(500);

        builder.HasOne(o => o.Employee)
            .WithMany()
            .HasForeignKey(o => o.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Project)
            .WithMany()
            .HasForeignKey(o => o.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(o => o.Task)
            .WithMany()
            .HasForeignKey(o => o.TaskId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(o => new { o.EmployeeId, o.Date });
        builder.HasIndex(o => o.Status);
    }
}
