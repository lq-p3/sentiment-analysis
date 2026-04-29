namespace SmartTourism.API.DTOs
{
    public class AiChatRequestDto
    {
        public string CityName { get; set; } = string.Empty;
        public int TotalReviews { get; set; }
        public double PositivePercentage { get; set; }
        public double NegativePercentage { get; set; }
        public string Keywords { get; set; } = string.Empty;
        public string? UserQuestion { get; set; }
    }

    public class AiChatResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Error { get; set; }
    }
}
