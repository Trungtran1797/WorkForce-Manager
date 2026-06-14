using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class SalaryConfigConfiguration : IEntityTypeConfiguration<SalaryConfig>
{
    public void Configure(EntityTypeBuilder<SalaryConfig> builder)
    {
        builder.ToTable("SalaryConfigs");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.BaseSalary).HasColumnType("decimal(18,2)");
        builder.Property(s => s.Allowance).HasColumnType("decimal(18,2)");
        builder.Property(s => s.InsuranceSalary).HasColumnType("decimal(18,2)");

        builder.HasOne(s => s.Employee)
            .WithMany()
            .HasForeignKey(s => s.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => s.EmployeeId).IsUnique();
    }
}
