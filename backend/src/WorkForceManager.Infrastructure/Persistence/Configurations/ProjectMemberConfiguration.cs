using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class ProjectMemberConfiguration : IEntityTypeConfiguration<ProjectMember>
{
    public void Configure(EntityTypeBuilder<ProjectMember> builder)
    {
        builder.ToTable("ProjectMembers");
        builder.HasKey(pm => pm.Id);

        builder.Property(pm => pm.RoleInProject).HasMaxLength(100);

        builder.HasOne(pm => pm.Project)
            .WithMany(p => p.Members)
            .HasForeignKey(pm => pm.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pm => pm.Employee)
            .WithMany()
            .HasForeignKey(pm => pm.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(pm => new { pm.ProjectId, pm.EmployeeId }).IsUnique();
    }
}
