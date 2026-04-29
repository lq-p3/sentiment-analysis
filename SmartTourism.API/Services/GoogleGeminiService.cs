using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using SmartTourism.API.DTOs;

namespace SmartTourism.API.Services
{
    public class GoogleGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GoogleGeminiService> _logger;

        // Fallback model chain: try each model in order if rate-limited
        private static readonly string[] ModelChain = new[]
        {
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-2.5-flash"
        };

        public GoogleGeminiService(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<GoogleGeminiService> logger)
        {
            // Use the named client with 30s timeout
            _httpClient = httpClientFactory.CreateClient("GeminiClient");
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<AiChatResponseDto> GenerateChatResponseAsync(AiChatRequestDto request)
        {
            var apiKey = _configuration["GeminiApiKey"];
            
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return new AiChatResponseDto 
                { 
                    Success = false, 
                    Message = "المساعد الذكي غير متوفر حالياً. يرجى من المسؤول إضافة مفتاح (Gemini) في الإعدادات المركزية الخادمة.",
                    Error = "MISSING_API_KEY" 
                };
            }

            var systemPrompt = $@"
أنت مستشار سياحي ذكي وخبير في تحليل البيانات الخاصة بالمملكة العربية السعودية. إجابتك بالعربية الفصحى ومختصرة جداً وصارمة بناءً على البيانات فقط.
--- السياق لمدينة: {request.CityName} ---
إجمالي التقييمات: {request.TotalReviews}
إيجابي: {request.PositivePercentage}%
سلبي: {request.NegativePercentage}%
الكلمات المفتاحية: {request.Keywords}
------------------------------
";

            var userInstruction = string.IsNullOrWhiteSpace(request.UserQuestion) 
                ? "اكتب ملخصاً استنتاجياً سريعاً في 3 أسطر فقط."
                : $"أجب على السؤال: '{request.UserQuestion}'";

            var fullPrompt = $"{systemPrompt}\n{userInstruction}";

            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = fullPrompt }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.2,
                    topK = 10,
                    topP = 0.8
                }
            };

            var jsonPayload = JsonSerializer.Serialize(payload);

            // Try each model in the fallback chain
            foreach (var model in ModelChain)
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
                _logger.LogInformation("Trying Gemini model: {Model}", model);

                // Retry logic with exponential backoff for each model
                const int maxRetries = 2;
                bool modelRateLimited = false;

                for (int attempt = 1; attempt <= maxRetries; attempt++)
                {
                    try
                    {
                        var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
                        var response = await _httpClient.PostAsync(url, requestContent);
                        var responseString = await response.Content.ReadAsStringAsync();

                        // Handle rate limiting - try next model in chain
                        if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                        {
                            _logger.LogWarning("Model {Model} rate limited (attempt {Attempt}/{Max}).", model, attempt, maxRetries);
                            
                            if (attempt < maxRetries)
                            {
                                // Extract retry delay from API response, default to 3 seconds
                                var retryDelay = ExtractRetryDelay(responseString);
                                var waitSeconds = Math.Min(retryDelay > 0 ? retryDelay : 3, 10); // Cap at 10s
                                await Task.Delay(TimeSpan.FromSeconds(waitSeconds));
                                continue;
                            }
                            
                            // All retries exhausted for this model, move to next
                            modelRateLimited = true;
                            break;
                        }
                        // Handle 503 (Service Unavailable / High Demand) same as rate limit - try next model
                        if (response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable)
                        {
                            _logger.LogWarning("Model {Model} service unavailable (attempt {Attempt}/{Max}).", model, attempt, maxRetries);
                            if (attempt < maxRetries)
                            {
                                await Task.Delay(TimeSpan.FromSeconds(3));
                                continue;
                            }
                            modelRateLimited = true;
                            break;
                        }

                        if (!response.IsSuccessStatusCode)
                        {
                            _logger.LogError("Gemini API Error ({Model}, HTTP {Status}): {Error}", model, response.StatusCode, responseString);
                            return new AiChatResponseDto 
                            { 
                                Success = false, 
                                Message = "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى المحاولة لاحقاً.",
                                Error = $"HTTP {response.StatusCode}"
                            };
                        }

                        using var jsonDoc = JsonDocument.Parse(responseString);
                        var root = jsonDoc.RootElement;
                        
                        var generatedText = root
                            .GetProperty("candidates")[0]
                            .GetProperty("content")
                            .GetProperty("parts")[0]
                            .GetProperty("text")
                            .GetString();

                        _logger.LogInformation("Successfully generated response using model: {Model}", model);
                        return new AiChatResponseDto 
                        { 
                            Success = true, 
                            Message = generatedText ?? "لا توجد إجابة." 
                        };
                    }
                    catch (TaskCanceledException)
                    {
                        _logger.LogWarning("Model {Model} timed out (attempt {Attempt}/{Max}).", model, attempt, maxRetries);
                        if (attempt < maxRetries)
                        {
                            await Task.Delay(TimeSpan.FromSeconds(2));
                            continue;
                        }
                        // Timeout on all retries for this model - try next model
                        modelRateLimited = true;
                        break;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to call {Model} (attempt {Attempt}/{Max})", model, attempt, maxRetries);
                        if (attempt < maxRetries)
                        {
                            await Task.Delay(TimeSpan.FromSeconds(1));
                            continue;
                        }
                        return new AiChatResponseDto 
                        { 
                            Success = false, 
                            Message = "فشل الاتصال بالخدمة السحابية.",
                            Error = ex.Message
                        };
                    }
                }

                if (modelRateLimited)
                {
                    _logger.LogWarning("Model {Model} exhausted. Trying next model in chain...", model);
                    continue;
                }
            }

            // All models exhausted
            return new AiChatResponseDto 
            { 
                Success = false, 
                Message = "الخدمة مشغولة حالياً بسبب كثرة الطلبات. يرجى الانتظار دقيقة ثم المحاولة مرة أخرى.",
                Error = "ALL_MODELS_RATE_LIMITED"
            };
        }

        /// <summary>
        /// Extracts retry delay in seconds from a Gemini API 429 response body.
        /// Looks for the retryDelay field in the response JSON.
        /// </summary>
        private int ExtractRetryDelay(string responseBody)
        {
            try
            {
                using var doc = JsonDocument.Parse(responseBody);
                var details = doc.RootElement.GetProperty("error").GetProperty("details");
                foreach (var detail in details.EnumerateArray())
                {
                    if (detail.TryGetProperty("retryDelay", out var delay))
                    {
                        var delayStr = delay.GetString() ?? "";
                        // Parse "48s" or "48.5s" format
                        delayStr = delayStr.TrimEnd('s');
                        if (double.TryParse(delayStr, out var seconds))
                        {
                            return (int)Math.Ceiling(seconds);
                        }
                    }
                }
            }
            catch { /* Ignore parsing errors */ }
            return 0;
        }
    }
}
