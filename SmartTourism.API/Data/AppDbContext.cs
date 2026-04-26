// ربط قاعدة البيانات SQLite وتعريف الجداول والعلاقات
using Microsoft.EntityFrameworkCore;
using SmartTourism.API.Models;

namespace SmartTourism.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // الجداول الثلاثة
        public DbSet<User> Users { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<Review> Reviews { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // الإيميل لازم يكون فريد (ما يتكرر)
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // كل مستخدم ما يقدر يكرر نفس التقرير
            modelBuilder.Entity<Report>()
                .HasIndex(r => new { r.UserId, r.ReportKey })
                .IsUnique();

            modelBuilder.Entity<Report>()
                .HasIndex(r => r.UserId);

            // فهرس على هاش التقييم لتسريع البحث عن التكرارات
            modelBuilder.Entity<Review>()
                .HasIndex(r => r.ReviewHash);

            modelBuilder.Entity<Review>()
                .HasIndex(r => r.ReportId);
        }
    }
}
