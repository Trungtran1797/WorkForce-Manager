using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class EmploymentContractConfiguration : IEntityTypeConfiguration<EmploymentContract>
{
    public void Configure(EntityTypeBuilder<EmploymentContract> builder)
    {
        builder.ToTable("EmploymentContracts");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.ContractCode).IsRequired().HasMaxLength(50);
        builder.Property(c => c.ContractType).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.BaseSalary).HasColumnType("decimal(18,2)");
        builder.Property(c => c.Allowance).HasColumnType("decimal(18,2)");
        builder.Property(c => c.InsuranceSalary).HasColumnType("decimal(18,2)");
        builder.Property(c => c.FileUrl).HasMaxLength(500);

        builder.HasIndex(c => c.ContractCode).IsUnique();

        builder.HasOne(c => c.Employee)
            .WithMany()
            .HasForeignKey(c => c.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.ParentContract)
            .WithMany()
            .HasForeignKey(c => c.ParentContractId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
