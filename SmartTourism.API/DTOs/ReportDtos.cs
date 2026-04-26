// كائنات نقل بيانات التقارير (DTOs)
using System.ComponentModel.DataAnnotations;

namespace SmartTourism.API.DTOs
{
    // طلب إنشاء تقرير جديد
    public class GenerateReportDto
    {
        [Required]
        public string City { get; set; } = string.Empty;

        [Required]
        public List<string> Sources { get; set; } = new(); // مثل: GoogleMaps

        [Required]
        public DateTime DateFrom { get; set; }

        [Required]
        public DateTime DateTo { get; set; }

        public int? Limit { get; set; } = 200; // عدد التقييمات المطلوبة
    }

    // ملخص التقرير (يظهر في القائمة)
    public class ReportSummaryDto
    {
        public Guid Id { get; set; }
        public string City { get; set; } = string.Empty;
        public List<string> Sources { get; set; } = new();
        public DateTime DateFrom { get; set; }
        public DateTime DateTo { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int TotalReviews { get; set; }
        public int PositiveCount { get; set; }
        public int NegativeCount { get; set; }
        public int NeutralCount { get; set; }
    }

    // تفاصيل التقرير الكاملة
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
        public string? ReportJson { get; set; } // التقرير كاملاً كـ JSON
    }
}
