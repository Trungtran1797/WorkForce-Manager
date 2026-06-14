using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class PerformanceReviewConfiguration : IEntityTypeConfiguration<PerformanceReview>
{
    public void Configure(EntityTypeBuilder<PerformanceReview> builder)
    {
        builder.ToTable("PerformanceReviews");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Period).IsRequired().HasMaxLength(10);
        builder.Property(r => r.ReviewType).HasConversion<string>().HasMaxLength(20);
        builder.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(r => r.OverallRating).HasConversion<string>().HasMaxLength(20);
        builder.Property(r => r.OverallScore).HasColumnType("decimal(5,2)");
        builder.Property(r => r.Comment).HasMaxLength(2000);

        builder.HasOne(r => r.Employee)
            .WithMany()
            .HasForeignKey(r => r.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Reviewer)
            .WithMany()
            .HasForeignKey(r => r.ReviewerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Criteria)
            .WithOne(c => c.Review)
            .HasForeignKey(c => c.ReviewId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => new { r.EmployeeId, r.Period, r.ReviewType });
    }
}

public class ReviewCriterionConfiguration : IEntityTypeConfiguration<ReviewCriterion>
{
    public void Configure(EntityTypeBuilder<ReviewCriterion> builder)
    {
        builder.ToTable("ReviewCriteria");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Criterion).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Weight).HasColumnType("decimal(5,2)");
        builder.Property(c => c.Note).HasMaxLength(1000);
    }
}
