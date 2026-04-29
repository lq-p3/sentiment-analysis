// نقطة بداية السيرفر - إعداد قاعدة البيانات والأمان والخدمات
// the point start server and satting database and security and services
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartTourism.API.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// تسجيل الخدمات
builder.Services.AddControllers();
builder.Services.AddHttpClient("GeminiClient", client => {
    client.Timeout = TimeSpan.FromSeconds(60);
});
builder.Services.AddScoped<SmartTourism.API.Services.GoogleGeminiService>();

// ربط قاعدة بيانات SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// إعداد CORS - نسمح للواجهة الأمامية بالاتصال بالسيرفر
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

// إعداد JWT - حماية الـ API بتوكن مشفر
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!))
    };
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // توثيق الـ API

var app = builder.Build();

// تفعيل Swagger في بيئة التطوير فقط
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthentication(); // التحقق من التوكن
app.UseAuthorization();  // التحقق من الصلاحيات
app.MapControllers();
app.Run();
