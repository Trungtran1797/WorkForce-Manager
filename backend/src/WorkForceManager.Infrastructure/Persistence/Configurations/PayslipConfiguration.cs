using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class PayslipConfiguration : IEntityTypeConfiguration<Payslip>
{
    public void Configure(EntityTypeBuilder<Payslip> builder)
    {
        builder.ToTable("Payslips");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Period).IsRequired().HasMaxLength(7);
        builder.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(p => p.OvertimeHours).HasColumnType("decimal(7,2)");

        foreach (var prop in new[]
                 {
                     nameof(Payslip.BaseSalary), nameof(Payslip.Allowance), nameof(Payslip.OvertimePay),
                     nameof(Payslip.GrossSalary), nameof(Payslip.Insurance), nameof(Payslip.PersonalDeduction),
                     nameof(Payslip.DependentDeduction), nameof(Payslip.TaxableIncome),
                     nameof(Payslip.PersonalIncomeTax), nameof(Payslip.NetSalary)
                 })
        {
            builder.Property(prop).HasColumnType("decimal(18,2)");
        }

        builder.HasOne(p => p.Employee)
            .WithMany()
            .HasForeignKey(p => p.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.Items)
            .WithOne(i => i.Payslip)
            .HasForeignKey(i => i.PayslipId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => new { p.EmployeeId, p.Period }).IsUnique();
    }
}

public class PayslipItemConfiguration : IEntityTypeConfiguration<PayslipItem>
{
    public void Configure(EntityTypeBuilder<PayslipItem> builder)
    {
        builder.ToTable("PayslipItems");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Label).IsRequired().HasMaxLength(150);
        builder.Property(i => i.Amount).HasColumnType("decimal(18,2)");
    }
}
