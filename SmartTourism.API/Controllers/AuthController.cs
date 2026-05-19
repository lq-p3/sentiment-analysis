// ===================================================================
// AuthController.cs
// Handles all authentication flows: Register, Login, OTP verification,
// password reset, and fetching the current authenticated user's profile.
// Route base: /api/auth
// ===================================================================
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartTourism.API.Data;             // AppDbContext (SQLite)
using SmartTourism.API.DTOs;             // RegisterDto, LoginDto, OtpVerificationDto, etc.
using SmartTourism.API.Models;           // User model
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Caching.Memory; // IMemoryCache for OTP storage
using SmartTourism.API.Services;           // IEmailService for sending OTP emails

namespace SmartTourism.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // Base route: /api/auth
    public class AuthController : ControllerBase
    {
        // --- Injected Dependencies ---
        private readonly AppDbContext _context;         // Database access
        private readonly IConfiguration _configuration; // appsettings.json values (JWT keys, etc.)
        private readonly IMemoryCache _cache;           // Temporary in-memory OTP store
        private readonly IEmailService _emailService;   // SMTP email sender

        public AuthController(AppDbContext context, IConfiguration configuration, IMemoryCache cache, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _cache = cache;
            _emailService = emailService;
        }

        // Generates a 6-digit OTP, caches it for 5 minutes, and sends it via email
        private async Task<bool> GenerateAndSendOtpAsync(string email, string purpose)
        {
            var code = new Random().Next(100000, 999999).ToString();
            _cache.Set(email, code, TimeSpan.FromMinutes(5)); // OTP expires after 5 minutes
            return await _emailService.SendVerificationEmailAsync(email, code, purpose);
        }

        // POST /api/auth/register
        // Creates a new user account, hashes the password with BCrypt, then sends an OTP email
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            // Reject registration if the email is already in use
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest("Email already registered.");
            }

            // Create user with BCrypt-hashed password (never stored as plain text)
            var user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Role = "user",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Send OTP verification email after successful registration
            await GenerateAndSendOtpAsync(dto.Email, "verification");

            return Ok(new { message = "User registered successfully" });
        }

        // POST /api/auth/login
        // Validates credentials, sends an OTP email, and returns a signed JWT token
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            // Look up user by email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            // Verify the BCrypt password hash — returns 401 if credentials are wrong
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid credentials.");
            }

            // Send OTP for two-factor verification
            await GenerateAndSendOtpAsync(dto.Email, "verification");

            // Issue a signed JWT token valid for 7 days
            var token = GenerateJwtToken(user);
            return Ok(new { token });
        }

        // POST /api/auth/check-email
        // Confirms the email exists in the system, then triggers a password-reset OTP
        [HttpPost("check-email")]
        public async Task<IActionResult> CheckEmail(EmailDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
            {
                return NotFound(new { message = "Email not found in our records." });
            }

            // Send a reset-purpose OTP to the confirmed email
            await GenerateAndSendOtpAsync(dto.Email, "reset");
            return Ok(new { message = "Email verified. Proceed to OTP." });
        }

        // POST /api/auth/verify-otp
        // Checks the submitted OTP code against the cached value; invalidates it after use
        [HttpPost("verify-otp")]
        public IActionResult VerifyOtp(OtpVerificationDto dto)
        {
            if (_cache.TryGetValue(dto.Email, out string? savedCode))
            {
                if (savedCode == dto.Code)
                {
                    _cache.Remove(dto.Email); // Invalidate OTP after successful verification (one-time use)
                    return Ok(new { message = "OTP verified successfully." });
                }
            }
            return BadRequest(new { message = "Invalid or expired OTP." });
        }

        // POST /api/auth/reset-password
        // Updates the user's password with a new BCrypt hash
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
            {
                // Return Ok even when email is not found — prevents email enumeration attacks
                return Ok(new { message = "If the email is registered, the password has been reset successfully." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password has been reset successfully." });
        }

        // GET /api/auth/me  [Requires valid JWT]
        // Returns the profile of the currently authenticated user (no password hash exposed)
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            // Extract user ID from the JWT claims
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _context.Users.FindAsync(Guid.Parse(userId));
            if (user == null) return NotFound("User not found.");

            // Return a safe DTO — never expose PasswordHash to the client
            return Ok(new UserDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role
            });
        }

        // Builds and signs a JWT token embedding the user's ID, email, and role as claims
        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), // Used by [Authorize] to identify the user
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"],
                audience: _configuration["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7), // Token is valid for 7 days
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

