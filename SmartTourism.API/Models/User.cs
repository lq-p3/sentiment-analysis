// ===================================================================
// User.cs — EF Core entity mapped to the "Users" SQLite table.
// Passwords are never stored in plain text — only BCrypt hashes.
// ===================================================================
using System.ComponentModel.DataAnnotations;

namespace SmartTourism.API.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid(); // Auto-generated unique identifier

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty; // Unique index enforced in AppDbContext

        [Required]
        public string PasswordHash { get; set; } = string.Empty; // BCrypt hash — never the plain password

        [Required]
        public string Role { get; set; } = "user"; // "user" or "admin"

        public string? ResetPasswordToken { get; set; }      // Legacy field (OTP replaced token-based reset)

        public DateTime? ResetPasswordTokenExpiry { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // One-to-many: a user can own multiple reports
        public ICollection<Report> Reports { get; set; } = new List<Report>();
    }
}

