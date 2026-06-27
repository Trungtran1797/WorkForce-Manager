using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employees");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.EmployeeCode).IsRequired().HasMaxLength(30);
        builder.Property(e => e.FullName).IsRequired().HasMaxLength(150);
        builder.Property(e => e.IdCardNumber).HasMaxLength(20);
        builder.Property(e => e.PhoneNumber).HasMaxLength(20);
        builder.Property(e => e.Email).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Address).HasMaxLength(300);
        builder.Property(e => e.Position).HasMaxLength(100);
        builder.Property(e => e.PlaceOfOrigin).HasMaxLength(200);
        builder.Property(e => e.MaritalStatus).HasMaxLength(50);
        builder.Property(e => e.OneOfficeAccount).HasMaxLength(150);

        builder.Property(e => e.Gender).HasConversion<string>().HasMaxLength(20);
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(e => e.EmployeeCode).IsUnique();
        builder.HasIndex(e => e.Email).IsUnique();
        builder.HasIndex(e => e.DepartmentId);
        builder.HasIndex(e => e.Status);
    }
}
