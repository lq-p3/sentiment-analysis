// ===================================================================
// ReportDtos.cs
// Data Transfer Objects for the reports API endpoints.
// GenerateReportDto  → request to create a new report
// ReportSummaryDto   → lightweight card shown in the sidebar list
// ReportDetailDto    → full report data returned after generation
// ===================================================================
using System.ComponentModel.DataAnnotations;

namespace SmartTourism.API.DTOs
{
    // POST /api/reports/generate — parameters for a new analysis request
    public class GenerateReportDto
    {
        [Required]
        public string City { get; set; } = string.Empty;        // e.g. "Riyadh" or "Jeddah"

        [Required]
        public List<string> Sources { get; set; } = new();      // e.g. ["GoogleMaps"]

        [Required]
        public DateTime DateFrom { get; set; }                  // Start of the review date range

        [Required]
        public DateTime DateTo { get; set; }                    // End of the review date range

        public int? Limit { get; set; } = 200;                  // Max number of reviews to scrape
    }

    // Lightweight summary used in the sidebar report list (GET /api/reports)
    public class ReportSummaryDto
    {
        public Guid Id { get; set; }
        public string City { get; set; } = string.Empty;
        public List<string> Sources { get; set; } = new();
        public DateTime DateFrom { get; set; }
        public DateTime DateTo { get; set; }
        public string Status { get; set; } = string.Empty;      // Processing | Completed | Failed
        public DateTime CreatedAt { get; set; }
        public int TotalReviews { get; set; }
        public int PositiveCount { get; set; }
        public int NegativeCount { get; set; }
        public int NeutralCount { get; set; }
    }

    // Full report detail returned by GET /api/reports/{id} and POST /api/reports/generate
    public class ReportDetailDto
    {
        public Guid Id { get; set; }
        public string City { get; set; } = string.Empty;
        public List<string> Sources { get; set; } = new();
        public DateTime DateFrom { get; set; }
        public DateTime DateTo { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ModelVersion { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int TotalReviews { get; set; }
        public int PositiveCount { get; set; }
        public int NegativeCount { get; set; }
        public int NeutralCount { get; set; }
        public string? ReportJson { get; set; }                 // Full report snapshot as JSON for direct frontend rendering
    }
}

