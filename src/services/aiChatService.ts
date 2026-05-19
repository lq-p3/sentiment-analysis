// ===================================================================
// aiChatService.ts
// Handles all communication between the React frontend and the
// ASP.NET Core backend's AI endpoint, which relays requests to Gemini.
// ===================================================================
import { CityAnalysisData } from '../types'; // Type for city report data

// Backend endpoint that proxies requests to Google Gemini
const BACKEND_AI_URL = 'http://localhost:5165/api/ai/chat';

// Shape of the response returned by the backend AI endpoint
export interface ChatResponse {
  message: string;   // AI-generated text response
  success: boolean;  // Whether the request succeeded
  error?: string;    // Optional error detail
}

/**
 * Sends the analytical data to the secure ASP.NET Core backend to communicate with Google Gemini.
 * 
 * @param reportData The analytical report data
 * @param userQuestion The user's query, or null to generate a default summary
 */
export async function askAiAssistant(
  reportData: CityAnalysisData | null,
  userQuestion: string | null
): Promise<ChatResponse> {
  
  // Guard: cannot analyze without report data
  if (!reportData) {
    return { success: false, message: "لا توجد بيانات تقرير لتقديم المشورة." };
  }

  // Pre-calculate percentages and extract top 15 keywords for the prompt
  const positivePct = (reportData.stats.positiveCount / reportData.stats.totalReviews) * 100;
  const negativePct = (reportData.stats.negativeCount / reportData.stats.totalReviews) * 100;
  const keywordsStr = reportData.topWords.map(k => k.text).slice(0, 15).join("، ");

  // Build the structured payload sent to the backend
  // If userQuestion is null, Gemini generates an opening summary
  const payload = {
    CityName: reportData.cityName || "الوجهة السياحية",
    TotalReviews: reportData.stats.totalReviews,
    PositivePercentage: Math.round(positivePct * 10) / 10,
    NegativePercentage: Math.round(negativePct * 10) / 10,
    Keywords: keywordsStr,
    UserQuestion: userQuestion
  };

  try {
    const response = await fetch(BACKEND_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    // Handle non-2xx HTTP responses from the backend
    if (!response.ok) {
        return { 
          success: false, 
          message: data.message || "حدث خطأ غير متوقع من الخادم المضيف.",
          error: data.error || `HTTP ${response.status}`
        };
    }

    return { success: true, message: data.message };

  } catch (err: any) {
    // Network-level failure (e.g. backend is offline)
    console.error("Backend AI Communication Error:", err);
    return { 
        success: false, 
        message: "فشل الاتصال بالخادم. يرجى التأكد من أن (ASP.NET Backend) قيد التشغيل.",
        error: err.message
    };
  }
}
