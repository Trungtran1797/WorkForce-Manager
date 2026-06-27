using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Persistence.Configurations;

public class UserEmailConfigConfiguration : IEntityTypeConfiguration<UserEmailConfig>
{
    public void Configure(EntityTypeBuilder<UserEmailConfig> builder)
    {
        builder.ToTable("UserEmailConfigs");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Provider)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(c => c.EmailAddress)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(c => c.ImapHost).HasMaxLength(255);
        builder.Property(c => c.ImapUsername).HasMaxLength(255);
        builder.Property(c => c.ImapPassword).HasMaxLength(1000);

        builder.Property(c => c.SmtpHost).HasMaxLength(255);
        builder.Property(c => c.SmtpUsername).HasMaxLength(255);
        builder.Property(c => c.SmtpPassword).HasMaxLength(1000);

        builder.Property(c => c.GmailRefreshToken).HasMaxLength(2000);
        builder.Property(c => c.GmailAccessToken).HasMaxLength(2000);

        builder.Property(c => c.AiProvider).HasMaxLength(50);
        builder.Property(c => c.AiModel).HasMaxLength(100);
        builder.Property(c => c.AiApiKey).HasMaxLength(2000);

        builder.HasOne(c => c.User)
            .WithOne(u => u.EmailConfig)
            .HasForeignKey<UserEmailConfig>(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
