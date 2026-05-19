// ===================================================================
// Review.cs — EF Core entity mapped to the "Reviews" SQLite table.
// Stores individual tourist reviews along with their CAMeLBERT
// sentiment predictions and extracted keywords.
// ===================================================================
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartTourism.API.Models
{
    public class Review
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid(); // Auto-generated primary key

        [Required]
        public Guid ReportId { get; set; }              // Foreign key — the parent report

        [ForeignKey("ReportId")]
        public Report Report { get; set; } = null!;     // Navigation property

        [Required]
        [MaxLength(50)]
        public string Source { get; set; } = string.Empty; // Data source (e.g. "GoogleMaps")

        [Required]
        public string ReviewText { get; set; } = string.Empty; // Original review text

        [MaxLength(10)]
        public string? Language { get; set; }           // Detected language: "ar" or "en"

        public double? Rating { get; set; }             // Star rating 1–5 (null if not provided)

        [MaxLength(200)]
        public string? PlaceId { get; set; }            // Google Maps place ID

        // SHA256 hash of (source + placeId + reviewText) — prevents saving duplicate reviews
        [MaxLength(128)]
        public string? ReviewHash { get; set; }

        public DateTime? OriginalCreatedAt { get; set; } // Original review date from the source platform
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Date saved to our database

        // --- CAMeLBERT Sentiment Analysis Results ---
        [MaxLength(20)]
        public string PredictedLabel { get; set; } = string.Empty; // Positive | Negative | Neutral

        public double Score { get; set; }               // Model confidence score (0.0 – 1.0)

        public string? KeywordsJson { get; set; }        // JSON array of extracted keywords

        // --- Future Training Fields ---
        [MaxLength(20)]
        public string? HumanLabel { get; set; }          // Manual correction label for model retraining

        public bool IsApprovedForTraining { get; set; } = false; // Set to true when approved for fine-tuning
    }
}

