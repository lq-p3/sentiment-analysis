// جدول التقييمات - كل تقييم سياحي مع تصنيف مشاعره
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartTourism.API.Models
{
    public class Review
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ReportId { get; set; } // التقرير التابع له

        [ForeignKey("ReportId")]
        public Report Report { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string Source { get; set; } = string.Empty; // Google Maps 

        [Required]
        public string ReviewText { get; set; } = string.Empty; // نص التقييم

        [MaxLength(10)]
        public string? Language { get; set; } // ar أو en

        public double? Rating { get; set; } // عدد النجوم 1-5

        [MaxLength(200)]
        public string? PlaceId { get; set; }

        // هاش لمنع تكرار نفس التقييم
        [MaxLength(128)]
        public string? ReviewHash { get; set; }

        public DateTime? OriginalCreatedAt { get; set; } // تاريخ التقييم الأصلي
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // نتائج الذكاء الاصطناعي
        [MaxLength(20)]
        public string PredictedLabel { get; set; } = string.Empty; // Positive أو Negative أو Neutral

        public double Score { get; set; } // نسبة الثقة 0-1

        public string? KeywordsJson { get; set; } // الكلمات المفتاحية كـ JSON

        // حقول للتدريب المستقبلي
        [MaxLength(20)]
        public string? HumanLabel { get; set; } // تصنيف يدوي للتصحيح

        public bool IsApprovedForTraining { get; set; } = false;
    }
}
