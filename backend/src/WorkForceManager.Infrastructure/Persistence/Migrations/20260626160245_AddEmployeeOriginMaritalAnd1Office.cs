using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkForceManager.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeOriginMaritalAnd1Office : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MaritalStatus",
                table: "Employees",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OneOfficeAccount",
                table: "Employees",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlaceOfOrigin",
                table: "Employees",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaritalStatus",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "OneOfficeAccount",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PlaceOfOrigin",
                table: "Employees");
        }
    }
}
