using Microsoft.AspNetCore.Mvc;
using SmartTourism.API.DTOs;
using SmartTourism.API.Services;

namespace SmartTourism.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly GoogleGeminiService _geminiService;

        public AiController(GoogleGeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] AiChatRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CityName))
            {
                return BadRequest(new AiChatResponseDto 
                { 
                    Success = false, 
                    Message = "البيانات المرسلة غير صحيحة أو ناقصة." 
                });
            }

            var response = await _geminiService.GenerateChatResponseAsync(request);
            
            if (!response.Success)
            {
                return StatusCode(500, response);
            }

            return Ok(response);
        }
    }
}
