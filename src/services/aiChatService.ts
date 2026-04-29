import { CityAnalysisData } from '../types';

const BACKEND_AI_URL = 'http://localhost:5165/api/ai/chat';

export interface ChatResponse {
  message: string;
  success: boolean;
  error?: string;
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
  
  if (!reportData) {
    return { success: false, message: "لا توجد بيانات تقرير لتقديم المشورة." };
  }

  const positivePct = (reportData.stats.positiveCount / reportData.stats.totalReviews) * 100;
  const negativePct = (reportData.stats.negativeCount / reportData.stats.totalReviews) * 100;
  const keywordsStr = reportData.topWords.map(k => k.text).slice(0, 15).join("، ");

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
    
    if (!response.ok) {
        return { 
          success: false, 
          message: data.message || "حدث خطأ غير متوقع من الخادم المضيف.",
          error: data.error || `HTTP ${response.status}`
        };
    }

    return { success: true, message: data.message };

  } catch (err: any) {
    console.error("Backend AI Communication Error:", err);
    return { 
        success: false, 
        message: "فشل الاتصال بالخادم. يرجى التأكد من أن (ASP.NET Backend) قيد التشغيل.",
        error: err.message
    };
  }
}
