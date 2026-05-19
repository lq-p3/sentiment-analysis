// ===================================================================
// ReportsController.cs
// Manages the full report lifecycle: generation, retrieval, and caching.
// Communicates with the Python ML microservice (FastAPI on port 8000)
// to run sentiment analysis, then persists results in SQLite.
// Route base: /api/reports  |  All endpoints require a valid JWT.
// ===================================================================
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartTourism.API.Data;    // AppDbContext
using SmartTourism.API.DTOs;    // GenerateReportDto, ReportDetailDto, ReportSummaryDto
using SmartTourism.API.Models;  // Report, Review
using System.Security.Claims;
using System.Security.Cryptography; // SHA256 for deduplication keys
using System.Text;
using System.Text.Json;

namespace SmartTourism.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // All endpoints in this controller require a valid JWT token
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory; // Used to call the Python ML service
        private const string CurrentModelVersion = "v1.0";     // Embedded in the report key to invalidate cache on model updates

        public ReportsController(AppDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }

        // Extracts the authenticated user's GUID from the JWT NameIdentifier claim
        private Guid GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.Parse(userId!);
        }

        // Computes a deterministic SHA256 key for a report to prevent duplicate analysis
        // Key factors: userId, city (lowercase), sorted sources, date range, model version
        private static string ComputeReportKey(Guid userId, string city, List<string> sources, DateTime dateFrom, DateTime dateTo)
        {
            var sortedSources = sources.OrderBy(s => s).ToList();
            var payload = $"{userId}|{city.ToLowerInvariant()}|{string.Join(",", sortedSources)}|{dateFrom:yyyy-MM-dd}|{dateTo:yyyy-MM-dd}|{CurrentModelVersion}";
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        // Computes a SHA256 hash per review (source + placeId + text) to avoid saving duplicates
        private static string ComputeReviewHash(string source, string? placeId, string reviewText)
        {
            var payload = $"{source}|{placeId ?? ""}|{reviewText}";
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        // POST /api/reports/generate
        // Generates a new sentiment analysis report for a given city.
        // Returns a cached result if an identical report already exists.
        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromBody] GenerateReportDto dto)
        {
            var userId = GetUserId();
            var reportKey = ComputeReportKey(userId, dto.City, dto.Sources, dto.DateFrom, dto.DateTo);

            // Return existing completed report if the same parameters were already analyzed (cache hit)
            var existing = await _context.Reports
                .FirstOrDefaultAsync(r => r.UserId == userId && r.ReportKey == reportKey && r.Status == "Completed");

            if (existing != null)
            {
                return Ok(MapToDetail(existing));
            }

            // Create a new report record with "Processing" status before calling the ML service
            var report = new Report
            {
                UserId = userId,
                City = dto.City,
                Sources = JsonSerializer.Serialize(dto.Sources),
                DateFrom = dto.DateFrom,
                DateTo = dto.DateTo,
                ReportKey = reportKey,
                Status = "Processing",
                ModelVersion = CurrentModelVersion,
                Limit = dto.Limit
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            try
            {
                // Call the Python FastAPI microservice to scrape and analyze reviews
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromMinutes(10); // Scraping can be slow; allow up to 10 minutes
                var requestBody = new
                {
                    place_name = dto.City,
                    max_reviews = dto.Limit ?? 150,
                    lang = "ar"
                };

                var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                var response = await client.PostAsync("http://localhost:8000/api/analyze", content);

                if (!response.IsSuccessStatusCode)
                {
                    throw new Exception("Python ML service returned error: " + response.StatusCode);
                }

                // Deserialize the Python service response into strongly-typed records
                var jsonStr = await response.Content.ReadAsStringAsync();
                var pythonResponse = JsonSerializer.Deserialize<PythonAnalyzeResponse>(jsonStr, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                
                var mlReviews = pythonResponse?.reviews ?? new List<PythonReviewData>();

                // Save reviews in batches of 20 to avoid memory pressure on large datasets
                var reviewEntities = new List<Review>();
                foreach (var batch in mlReviews.Chunk(20))
                {
                    foreach (var mr in batch)
                    {
                        var reviewHash = ComputeReviewHash(mr.source, mr.place_id, mr.text);

                        // Re-use an already-analyzed review's label/score to avoid redundant ML calls
                        var existingReview = await _context.Reviews
                            .FirstOrDefaultAsync(r => r.ReviewHash == reviewHash && r.PredictedLabel != "");

                        var review = new Review
                        {
                            ReportId = report.Id,
                            Source = mr.source,
                            ReviewText = mr.text,
                            Language = mr.language,
                            Rating = mr.rating,
                            PlaceId = mr.place_id,
                            ReviewHash = reviewHash,
                            OriginalCreatedAt = mr.original_date,
                            PredictedLabel = existingReview?.PredictedLabel ?? mr.predicted_label,
                            Score = existingReview?.Score ?? mr.score,
                            KeywordsJson = existingReview?.KeywordsJson ?? JsonSerializer.Serialize(mr.keywords),
                            IsApprovedForTraining = false
                        };

                        reviewEntities.Add(review);
                    }

                    _context.Reviews.AddRange(batch.Select((mr, i) => reviewEntities[reviewEntities.Count - batch.Length + i]));
                    await _context.SaveChangesAsync();
                }

                // Calculate aggregate sentiment statistics
                var positiveCount = reviewEntities.Count(r => r.PredictedLabel == "Positive");
                var negativeCount = reviewEntities.Count(r => r.PredictedLabel == "Negative");
                var neutralCount = reviewEntities.Count(r => r.PredictedLabel == "Neutral");
                var total = reviewEntities.Count;

                report.TotalReviews = total;
                report.PositiveCount = positiveCount;
                report.NegativeCount = negativeCount;
                report.NeutralCount = neutralCount;

                // Compute percentage breakdown for pie chart rendering on the frontend
                var sentimentPct = new
                {
                    positive = total > 0 ? Math.Round(positiveCount * 100.0 / total, 1) : 0,
                    negative = total > 0 ? Math.Round(negativeCount * 100.0 / total, 1) : 0,
                    neutral = total > 0 ? Math.Round(neutralCount * 100.0 / total, 1) : 0
                };
                report.SentimentPercentagesJson = JsonSerializer.Serialize(sentimentPct);

                // Aggregate the top 15 most frequent keywords across all reviews for the word cloud
                var allKeywords = reviewEntities
                    .Where(r => r.KeywordsJson != null)
                    .SelectMany(r => JsonSerializer.Deserialize<List<string>>(r.KeywordsJson!) ?? new())
                    .GroupBy(k => k)
                    .Select(g => new { word = g.Key, count = g.Count() })
                    .OrderByDescending(x => x.count)
                    .Take(15)
                    .ToList();
                report.KeywordsTopJson = JsonSerializer.Serialize(allKeywords);

                // Build a self-contained JSON snapshot of the report for direct frontend rendering
                var reportSnapshot = new
                {
                    cityName = report.City,
                    timestamp = report.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                    stats = new
                    {
                        totalReviews = total,
                        positiveCount,
                        negativeCount,
                        neutralCount,
                        averageRating = reviewEntities.Where(r => r.Rating.HasValue).Select(r => r.Rating!.Value).DefaultIfEmpty(0).Average()
                    },
                    reviews = reviewEntities.Select(r => new
                    {
                        id = r.Id.ToString(),
                        text = r.ReviewText,
                        sentiment = r.PredictedLabel,
                        source = r.Source,
                        date = r.OriginalCreatedAt?.ToString("yyyy-MM-dd") ?? r.CreatedAt.ToString("yyyy-MM-dd"),
                        author = ""
                    }).ToList(),
                    topWords = allKeywords.Select(k => new { text = k.word, value = k.count * 10 }).ToList()
                };
                report.ReportJson = JsonSerializer.Serialize(reportSnapshot);

                report.Status = "Completed";
                report.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(MapToDetail(report));
            }
            catch (Exception)
            {
                // Mark the report as Failed so the frontend can display an error state
                report.Status = "Failed";
                report.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return StatusCode(500, "Report generation failed.");
            }
        }

        // GET /api/reports
        // Returns a paginated list of the authenticated user's reports (newest first)
        [HttpGet]
        public async Task<IActionResult> GetReports([FromQuery] int limit = 20)
        {
            var userId = GetUserId();
            var reportEntities = await _context.Reports
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Take(limit)
                .ToListAsync();

            var reports = reportEntities.Select(r => new ReportSummaryDto
            {
                Id = r.Id,
                City = r.City,
                Sources = JsonSerializer.Deserialize<List<string>>(r.Sources) ?? new(),
                DateFrom = r.DateFrom,
                DateTo = r.DateTo,
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                TotalReviews = r.TotalReviews,
                PositiveCount = r.PositiveCount,
                NegativeCount = r.NegativeCount,
                NeutralCount = r.NeutralCount
            }).ToList();

            return Ok(reports);
        }

        // GET /api/reports/latest
        // Returns the most recently completed report for the current user
        [HttpGet("latest")]
        public async Task<IActionResult> GetLatest()
        {
            var userId = GetUserId();
            var report = await _context.Reports
                .Where(r => r.UserId == userId && r.Status == "Completed")
                .OrderByDescending(r => r.CreatedAt)
                .FirstOrDefaultAsync();

            if (report == null)
                return NotFound(new { message = "No reports found." });

            return Ok(MapToDetail(report));
        }

        // GET /api/reports/{id}
        // Returns a specific report by GUID — only if it belongs to the current user
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var userId = GetUserId();
            var report = await _context.Reports
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (report == null)
                return NotFound(new { message = "Report not found." });

            return Ok(MapToDetail(report));
        }

        // Maps a Report entity to the DTO returned by all GET endpoints
        private static ReportDetailDto MapToDetail(Report r)
        {
            return new ReportDetailDto
            {
                Id = r.Id,
                City = r.City,
                Sources = JsonSerializer.Deserialize<List<string>>(r.Sources) ?? new(),
                DateFrom = r.DateFrom,
                DateTo = r.DateTo,
                Status = r.Status,
                ModelVersion = r.ModelVersion,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                TotalReviews = r.TotalReviews,
                PositiveCount = r.PositiveCount,
                NegativeCount = r.NegativeCount,
                NeutralCount = r.NeutralCount,
                ReportJson = r.ReportJson
            };
        }

        // Strongly-typed records matching the JSON shape returned by the Python ML service
        private record PythonReviewData(string source, string text, string language, double? rating, string place_id, string predicted_label, double score, List<string> keywords, DateTime? original_date);
        
        private record PythonAnalyzeResponse(List<PythonReviewData> reviews);
    }
}