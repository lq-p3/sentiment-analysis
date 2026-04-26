using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartTourism.API.Migrations
{
    /// <inheritdoc />
    public partial class AddReportsAndReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Reports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    City = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Sources = table.Column<string>(type: "TEXT", nullable: false),
                    DateFrom = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DateTo = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ReportKey = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ModelVersion = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TotalReviews = table.Column<int>(type: "INTEGER", nullable: false),
                    PositiveCount = table.Column<int>(type: "INTEGER", nullable: false),
                    NegativeCount = table.Column<int>(type: "INTEGER", nullable: false),
                    NeutralCount = table.Column<int>(type: "INTEGER", nullable: false),
                    SentimentPercentagesJson = table.Column<string>(type: "TEXT", nullable: true),
                    KeywordsTopJson = table.Column<string>(type: "TEXT", nullable: true),
                    ReportJson = table.Column<string>(type: "TEXT", nullable: true),
                    Limit = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reports_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ReportId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Source = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ReviewText = table.Column<string>(type: "TEXT", nullable: false),
                    Language = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    Rating = table.Column<double>(type: "REAL", nullable: true),
                    PlaceId = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    ReviewHash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    OriginalCreatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    PredictedLabel = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Score = table.Column<double>(type: "REAL", nullable: false),
                    KeywordsJson = table.Column<string>(type: "TEXT", nullable: true),
                    HumanLabel = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    IsApprovedForTraining = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Reports_ReportId",
                        column: x => x.ReportId,
                        principalTable: "Reports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reports_UserId",
                table: "Reports",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_UserId_ReportKey",
                table: "Reports",
                columns: new[] { "UserId", "ReportKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ReportId",
                table: "Reviews",
                column: "ReportId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ReviewHash",
                table: "Reviews",
                column: "ReviewHash");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "Reports");
        }
    }
}
