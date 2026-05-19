// ===================================================================
// Program.cs — Application Entry Point
// Configures all services: database, authentication, CORS, and DI.
// ===================================================================
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartTourism.API.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// --- Register Core Services ---
builder.Services.AddControllers();
builder.Services.AddMemoryCache(); // In-memory cache used for OTP storage during email verification
builder.Services.AddHttpClient("GeminiClient", client => {
    client.Timeout = TimeSpan.FromSeconds(60); // 60s timeout for Gemini API calls
});
builder.Services.AddScoped<SmartTourism.API.Services.GoogleGeminiService>(); // Cloud AI service
builder.Services.AddScoped<SmartTourism.API.Services.IEmailService, SmartTourism.API.Services.EmailService>(); // SMTP email service

// --- SQLite Database ---
// Reads connection string from appsettings.json ("DefaultConnection")
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- CORS Policy ---
// Allows the React frontend (Vite dev server on various ports) to communicate with this API
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

// --- JWT Authentication ---
// Reads key, issuer, and audience from appsettings.json ("JwtSettings")
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
        ValidateLifetime = true,          // Rejects expired tokens
        ValidateIssuerSigningKey = true,  // Verifies the secret key signature
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!))
    };
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // Generates interactive API documentation (Swagger UI)

var app = builder.Build();

// --- Middleware Pipeline ---

// Enable Swagger only in development environment
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");    // Must be before UseAuthentication
app.UseHttpsRedirection();
app.UseAuthentication();         // Validates the JWT token on protected routes
app.UseAuthorization();          // Enforces role/policy-based access control
app.MapControllers();
app.Run();
