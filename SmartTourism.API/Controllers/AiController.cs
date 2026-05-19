// ===================================================================
// AiController.cs
// Exposes the endpoint: POST /api/ai/chat
// Acts as a bridge — receives report data from the React frontend
// and forwards it to GoogleGeminiService for AI processing.
// ===================================================================
using Microsoft.AspNetCore.Mvc;
using SmartTourism.API.DTOs;   // AiChatRequestDto / AiChatResponseDto
using SmartTourism.API.Services; // GoogleGeminiService

namespace SmartTourism.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // Base route: /api/ai
    public class AiController : ControllerBase
    {
        // Injected via Dependency Injection (registered as Scoped in Program.cs)
        private readonly GoogleGeminiService _geminiService;

        public AiController(GoogleGeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        // POST /api/ai/chat
        // Receives city report data and an optional user question,
        // then returns a Gemini-generated AI response.
        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] AiChatRequestDto request)
        {
            // Validate that the request body is not empty and contains a city name
            if (request == null || string.IsNullOrWhiteSpace(request.CityName))
            {
                return BadRequest(new AiChatResponseDto 
                { 
                    Success = false, 
                    Message = "البيانات المرسلة غير صحيحة أو ناقصة." 
                });
            }

            // Forward the request to Gemini and await the AI response
            var response = await _geminiService.GenerateChatResponseAsync(request);
            
            // If Gemini call fails, return 500 with the error details
            if (!response.Success)
            {
                return StatusCode(500, response);
            }

            // Return 200 OK with the AI-generated message
            return Ok(response);
        }
    }
}
