// ===================================================================
// AppDbContext.cs — Entity Framework Core database context.
// Defines the three database tables and enforces unique indexes
// for deduplication (email uniqueness, report key uniqueness).
// ===================================================================
using Microsoft.EntityFrameworkCore;
using SmartTourism.API.Models;

namespace SmartTourism.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // The three main database tables
        public DbSet<User> Users { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<Review> Reviews { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Enforce unique emails — prevents duplicate user accounts
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Enforce unique (UserId + ReportKey) — prevents duplicate report analyses
            modelBuilder.Entity<Report>()
                .HasIndex(r => new { r.UserId, r.ReportKey })
                .IsUnique();

            // Index on UserId for fast report lookups per user
            modelBuilder.Entity<Report>()
                .HasIndex(r => r.UserId);

            // Index on ReviewHash for fast duplicate review detection
            modelBuilder.Entity<Review>()
                .HasIndex(r => r.ReviewHash);

            // Index on ReportId for fast review lookups per report
            modelBuilder.Entity<Review>()
                .HasIndex(r => r.ReportId);
        }
    }
}

