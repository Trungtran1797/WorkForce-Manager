using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkForceManager.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectAndTaskToOvertimeRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProjectId",
                table: "OvertimeRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TaskId",
                table: "OvertimeRequests",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OvertimeRequests_ProjectId",
                table: "OvertimeRequests",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_OvertimeRequests_TaskId",
                table: "OvertimeRequests",
                column: "TaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_OvertimeRequests_Projects_ProjectId",
                table: "OvertimeRequests",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_OvertimeRequests_Tasks_TaskId",
                table: "OvertimeRequests",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OvertimeRequests_Projects_ProjectId",
                table: "OvertimeRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_OvertimeRequests_Tasks_TaskId",
                table: "OvertimeRequests");

            migrationBuilder.DropIndex(
                name: "IX_OvertimeRequests_ProjectId",
                table: "OvertimeRequests");

            migrationBuilder.DropIndex(
                name: "IX_OvertimeRequests_TaskId",
                table: "OvertimeRequests");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "OvertimeRequests");

            migrationBuilder.DropColumn(
                name: "TaskId",
                table: "OvertimeRequests");
        }
    }
}
