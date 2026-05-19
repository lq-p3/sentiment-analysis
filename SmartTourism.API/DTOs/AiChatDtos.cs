// ===================================================================
// AiChatDtos.cs
// Data Transfer Objects for the AI chat endpoint (POST /api/ai/chat).
// AiChatRequestDto  → frontend sends report stats + optional question
// AiChatResponseDto → backend returns Gemini's generated text
// ===================================================================
namespace SmartTourism.API.DTOs
{
    // Payload sent by the React frontend to request an AI-generated response
    public class AiChatRequestDto
    {
        public string CityName { get; set; } = string.Empty;          // City being analyzed
        public int TotalReviews { get; set; }                         // Total number of reviews processed
        public double PositivePercentage { get; set; }                // % of positive reviews
        public double NegativePercentage { get; set; }                // % of negative reviews
        public string Keywords { get; set; } = string.Empty;          // Top keywords (comma-separated)
        public string? UserQuestion { get; set; }                     // null = generate opening summary
    }

    // Response returned by GoogleGeminiService back to the frontend
    public class AiChatResponseDto
    {
        public bool Success { get; set; }                             // Whether Gemini responded successfully
        public string Message { get; set; } = string.Empty;          // The AI-generated text
        public string? Error { get; set; }                            // Error code/message if Success = false
    }
}
