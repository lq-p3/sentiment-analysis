// ===================================================================
// AuthDtos.cs
// Data Transfer Objects for all authentication endpoints.
// These define the shape of incoming request bodies and outgoing
// responses — keeping the API contract separate from the DB models.
// ===================================================================
using System.ComponentModel.DataAnnotations;

namespace SmartTourism.API.DTOs
{
    // POST /api/auth/register — new user registration payload
    public class RegisterDto
    {
        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)] // Minimum password length enforced by the API
        public string Password { get; set; } = string.Empty;
    }

    // POST /api/auth/login — credentials payload
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
    }

    // POST /api/auth/reset-password — new password payload
    public class ResetPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }

    // GET /api/auth/me response — safe user profile (no PasswordHash exposed)
    public class UserDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    // POST /api/auth/check-email — verifies the email exists before sending OTP
    public class EmailDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    // POST /api/auth/verify-otp — submits the 6-digit OTP code
    public class OtpVerificationDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(6, MinimumLength = 6)] // Must be exactly 6 digits
        public string Code { get; set; } = string.Empty;
    }
}

