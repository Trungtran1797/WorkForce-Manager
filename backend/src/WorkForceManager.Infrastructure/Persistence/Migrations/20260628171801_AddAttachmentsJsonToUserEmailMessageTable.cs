using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkForceManager.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAttachmentsJsonToUserEmailMessageTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AttachmentsJson",
                table: "UserEmailMessages",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AttachmentsJson",
                table: "UserEmailMessages");
        }
    }
}
