using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class TaxBracketConfiguration : IEntityTypeConfiguration<TaxBracket>
{
    public void Configure(EntityTypeBuilder<TaxBracket> builder)
    {
        builder.ToTable("TaxBrackets");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.FromAmount).HasColumnType("decimal(18,2)");
        builder.Property(t => t.ToAmount).HasColumnType("decimal(18,2)");
        builder.Property(t => t.Rate).HasColumnType("decimal(5,4)");

        builder.HasIndex(t => t.Order).IsUnique();
    }
}
