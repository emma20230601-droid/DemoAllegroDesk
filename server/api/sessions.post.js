import { readBody, createError } from 'h3';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- ✨ 1. AI 出題邏輯：保持原本功能，僅負責 AI 運算 ---
async function generateAIQuiz(points, category, model, quizMode = 'ai', count = 10) {
  console.log(`[Gemini AI] 正在以「${quizMode}」模式生成 ${count} 題測驗...`);
  
  let modeInstruction = "";
  if (quizMode === 'memorize') {
    modeInstruction = `
      【測驗模式：熟背檢查】
      - 目標：測試學生對專有名詞、定義、數據、關鍵人名或結構的「精準記憶」。
      - 出題風格：題目應直接了當，例如「...的定義為何？」或「下列何者是...的關鍵組成？」。
      - 選項設計：選項應包含極為相似、容易混淆的專有名詞。
    `;
  } else {
    // 預設或 concept 觀念模式
    modeInstruction = `
      【測驗模式：觀念定義】
      - 目標：測試學生是否「理解」背後的邏輯與原理，而非死背。
      - 出題風格：使用情境題，例如「若遇到...情況，應如何應用...原理？」或「下列關於...觀念的敘述何者最能體現其本質？」。
      - 選項設計：選項應測試學生的判斷力，解釋為什麼 A 比 B 更適合。
    `;
  }

  const prompt = `
    你是一位專業的「${category}」導師。${modeInstruction}
    請根據以下「教學重點」，出 ${count} 題單選題，出題難度：高。
    
    【教學重點】：${points.join(', ')}
    
    【輸出要求】：
    1. 必須嚴格遵守 JSON 陣列格式，總共輸出 ${count} 個題目。
    2. 每題包含：question (題目)、options (三個選項的陣列)、correct (正確索引 0-2)、explanation (解析)。
    3. 解析必須詳盡，解釋正確選項的邏輯。
    
    請直接輸出 JSON 陣列，不要包含 Markdown 標籤：
    [
      {"question": "...", "options": ["...", "...", "..."], "correct": 0, "explanation": "..."},
      {"question": "...", "options": ["...", "...", "..."], "correct": 1, "explanation": "..."}
    ]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let rawText = response.text();
    
    let cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonStart = cleanJson.indexOf('['); 
    const jsonEnd = cleanJson.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1);
    }
    
    const quizArray = JSON.parse(cleanJson);
    return Array.isArray(quizArray) ? quizArray : [quizArray];
  } catch (e) {
    console.error(`[AI Error] 解析失敗：`, e);
    return [{ 
      question: "【系統提示】AI 老師目前正在休息，請稍後再試。", 
      options: ["我知道了", "稍後", "辛苦了"], 
      correct: 0, 
      explanation: "API 限制或解析錯誤。" 
    }];
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { action, sessionData, userConfig } = body;

    // --- 🛡️ 1. 配置優先權解析 ---
    const runtimeConfig = useRuntimeConfig(event);
    const FINAL_GEMINI_KEY = userConfig?.gemini_key || runtimeConfig.geminiApiKey;
    const FINAL_MODEL = runtimeConfig.geminiModel || "gemini-1.5-flash"; 

    if (!FINAL_GEMINI_KEY) {
      throw createError({ statusCode: 400, message: '遺失配置資訊 (Gemini API Key)' });
    }

    // --- ✨ 2. 初始化 AI 模型 ---
    const genAI = new GoogleGenerativeAI(FINAL_GEMINI_KEY);
    const model = genAI.getGenerativeModel({ 
      model: FINAL_MODEL, 
      generationConfig: { responseMimeType: "application/json" } 
    });

    // --- 📸 情況一：analyzeVision (維持原本的圖片分析功能) ---
    if (action === 'analyzeVision') {
      const { imagesArray, imageBase64, subjectConfigs } = body;
      const finalImages = imagesArray || (imageBase64 ? [imageBase64] : []);
      if (finalImages.length === 0) throw new Error('未接收到圖片數據');

      const categoriesList = Object.entries(subjectConfigs || {})
        .map(([main, sub]) => `${main}: [${sub.cats.join(', ')}]`)
        .join(' | ');

      const visionPrompt = `
        你是一位專業的學科老師。現在有 ${finalImages.length} 張筆記照片，請進行「深度綜合分析」。
        
        【分析任務】：
        1. 【自動分類】：必須從以下提供的「子分類清單」中，挑選一個最精確的名稱回傳。
        清單：${categoriesList}
        
        注意：請務必直接使用清單內的字詞。如果真的無法判定，請回傳「未分類」。
        2. 【綜合主題】：理出一個最完整的「總體主題名稱」。
        3. 【教學重點】：提取 8 到 12 個「高品質教學重點」，採「核心概念 - 詳細解釋」格式。

        【輸出要求】：
        - 語言：繁體中文。
        - 格式：嚴格 JSON，不要 Markdown 標籤。
        {
          "category": "選出的分類名稱",
          "topic": "綜合主題名稱",
          "points": [
            "核心概念1 - 詳細的解釋內容...",
            "核心概念2 - 詳細的解釋內容...",
            "..."
          ]
        }
      `;

      const imageParts = finalImages.map(data => ({
        inlineData: { data, mimeType: "image/jpeg" }
      }));

      const result = await model.generateContent([visionPrompt, ...imageParts]);
      const responseText = result.response.text().replace(/```json|```/g, '').trim();
      
      return { success: true, data: JSON.parse(responseText) };
    }

    // --- 📝 情況二：generateQuizOnly (取代原本 publishSession/refreshQuiz 中的 AI 部分) ---
    if (action === 'generateQuizOnly') {
      const finalQuizContent = await generateAIQuiz(
        sessionData.points, 
        sessionData.category || '全科', 
        model,
        sessionData.quizMode || 'concept',
        sessionData.quizCount || 10
      );

      return { 
        success: true, 
        quizGenerated: finalQuizContent 
      };
    }

    // --- ⚠️ 注意：其餘 updateSession, deleteSession 等 Sheets 寫入動作已交由前端 GAS 處理 ---
    return { success: false, message: '此 Action 已遷移至 GAS 或不支援' };

  } catch (error) {
    console.error('[Sessions API Error]', error);
    return { success: false, error: error.message };
  }
});
