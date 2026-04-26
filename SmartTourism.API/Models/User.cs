// جدول المستخدمين في قاعدة البيانات
using System.ComponentModel.DataAnnotations;

namespace SmartTourism.API.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid(); // معرف فريد تلقائي

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty; // كلمة المرور مشفرة بـ BCrypt

        [Required]
        public string Role { get; set; } = "user"; // user أو admin

        public string? ResetPasswordToken { get; set; } // لإعادة تعيين الباسورد
        
        public DateTime? ResetPasswordTokenExpiry { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // علاقة: كل مستخدم عنده عدة تقارير
        public ICollection<Report> Reports { get; set; } = new List<Report>();
    }
}
