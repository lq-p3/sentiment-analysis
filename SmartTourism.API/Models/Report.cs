// جدول التقارير - كل تقرير يحتوي نتائج تحليل مدينة معينة
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartTourism.API.Models
{
    public class Report
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; } // صاحب التقرير

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public string City { get; set; } = string.Empty; // اسم المدينة

        // المصادر كـ JSON مثل: ["GoogleMaps"]
        [Required]
        public string Sources { get; set; } = "[]";

        public DateTime DateFrom { get; set; }
        public DateTime DateTo { get; set; }

        // مفتاح فريد لمنع تكرار نفس التقرير (SHA256 hash)
        [Required]
        [MaxLength(128)]
        public string ReportKey { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Processing"; // Processing أو Completed أو Failed

        [MaxLength(50)]
        public string ModelVersion { get; set; } = "v1.0";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // ملخص الإحصائيات
        public int TotalReviews { get; set; }
        public int PositiveCount { get; set; }
        public int NegativeCount { get; set; }
        public int NeutralCount { get; set; }

        public string? SentimentPercentagesJson { get; set; } // النسب المئوية كـ JSON
        public string? KeywordsTopJson { get; set; }          // أكثر الكلمات تكراراً
        public string? ReportJson { get; set; }               // التقرير الكامل للعرض في الواجهة

        public int? Limit { get; set; }

        // علاقة: كل تقرير عنده عدة تقييمات
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
