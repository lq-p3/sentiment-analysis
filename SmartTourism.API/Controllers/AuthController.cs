// متحكم المصادقة - تسجيل الدخول وإنشاء الحسابات وإصدار التوكن
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartTourism.API.Data;
using SmartTourism.API.DTOs;
using SmartTourism.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SmartTourism.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // POST /api/auth/register - تسجيل حساب جديد
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            // نتأكد الإيميل مو مسجل من قبل
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest("Email already registered.");
            }

            // ننشئ المستخدم ونشفر الباسورد بـ BCrypt
            var user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Role = "user",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password) // تشفير كلمة المرور
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User registered successfully" });
        }

        // POST /api/auth/login - تسجيل الدخول
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            // نبحث عن المستخدم بالإيميل
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            // نتحقق من الباسورد المشفر
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid credentials.");
            }

            // نصدر JWT Token
            var token = GenerateJwtToken(user);
            return Ok(new { token });
        }

        // POST /api/auth/reset-password - إعادة تعيين كلمة المرور
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
            {
                // نرجع Ok حتى لو الإيميل غير موجود لمنع كشف الإيميلات المسجلة
                return Ok(new { message = "If the email is registered, the password has been reset successfully." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password has been reset successfully." });
        }

        // GET /api/auth/me - جلب بيانات المستخدم الحالي (يحتاج توكن)
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _context.Users.FindAsync(Guid.Parse(userId));
            if (user == null) return NotFound("User not found.");

            // نرجع بيانات المستخدم بدون الباسورد
            return Ok(new UserDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role
            });
        }

        // إنشاء JWT Token مشفر يحتوي على معرف المستخدم وإيميله وصلاحيته
        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"],
                audience: _configuration["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7), // التوكن صالح لـ 7 أيام
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
