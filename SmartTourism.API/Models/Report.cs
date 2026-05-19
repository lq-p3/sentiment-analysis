// ===================================================================
// Report.cs — EF Core entity mapped to the "Reports" SQLite table.
// Each report represents a sentiment analysis run for one city.
// A unique SHA256 ReportKey prevents duplicate analyses per user.
// ===================================================================
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartTourism.API.Models
{
    public class Report
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid(); // Auto-generated primary key

        [Required]
        public Guid UserId { get; set; }                // Foreign key — the user who created this report

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;         // Navigation property

        [Required]
        [MaxLength(200)]
        public string City { get; set; } = string.Empty; // Target city name (e.g. "Riyadh")

        // Serialized JSON array of data sources, e.g. ["GoogleMaps"]
        [Required]
        public string Sources { get; set; } = "[]";

        public DateTime DateFrom { get; set; }          // Start of the analyzed review date range
        public DateTime DateTo { get; set; }            // End of the analyzed review date range

        // SHA256 hash of (userId + city + sources + dateRange + modelVersion)
        // Used as a unique index to detect and return cached reports
        [Required]
        [MaxLength(128)]
        public string ReportKey { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Processing"; // Processing | Completed | Failed

        [MaxLength(50)]
        public string ModelVersion { get; set; } = "v1.0"; // Embedded in ReportKey for cache invalidation

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // --- Aggregate Sentiment Stats ---
        public int TotalReviews { get; set; }
        public int PositiveCount { get; set; }
        public int NegativeCount { get; set; }
        public int NeutralCount { get; set; }

        public string? SentimentPercentagesJson { get; set; } // JSON: { positive, negative, neutral } percentages
        public string? KeywordsTopJson { get; set; }          // JSON: top 15 most frequent keywords
        public string? ReportJson { get; set; }               // Full report snapshot for direct frontend rendering

        public int? Limit { get; set; }                       // Max reviews requested during generation

        // One-to-many: a report owns many individual reviews
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}

