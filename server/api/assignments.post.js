import { readBody, createError, getQuery } from 'h3';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenerativeAI } from "@google/generative-ai";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const subjectLibrary = {
  '國文': { role: '國文名師', cats: '字音字形、國學常識、閱讀測驗、作文修辭、文言文' },
  '英文': { role: '英文權威教授', cats: '單字片語、文法結構、克漏字、閱讀理解、聽力測驗' },
  '數學': { role: '數學奧林匹克教練', cats: '數與式、幾何圖形、代數運算、機率統計、邏輯推理' },
  '社會': { role: '社會科資深教師', cats: '地理考點、歷史事件、公民常識' },
  '自然': { role: '自然科學實驗室導師', cats: '物理現象、化學反應、生物科學、地球科學' },
  '樂理': { role: '音樂理論教授', cats: '基礎樂理、西洋音樂史、中國音樂史、樂器學' }
};

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const query = getQuery(event);
    const { action, imageBatch, subject, userConfig } = body;
    
    // --- 🛡️ 1. 沿用你的配置優先權解析 (門禁) ---
    const runtimeConfig = useRuntimeConfig(event);
    
    // 優先權：Body > Query > 門禁 userConfig > 環境變數
    const FINAL_GEMINI_KEY = userConfig?.gemini_key || runtimeConfig.geminiApiKey;
    const FINAL_GEMINI_MODEL = runtimeConfig.geminiModel || "gemini-2.0-flash"; // 建議保留為穩定版本
    const FINAL_CLOUDINARY_NAME = userConfig?.cloudinary_name || runtimeConfig.cloudinaryName;
    const FINAL_CLOUDINARY_KEY = userConfig?.cloudinary_api_key || runtimeConfig.cloudinaryApiKey;
    const FINAL_CLOUDINARY_SECRET = userConfig?.cloudinary_api_secret || runtimeConfig.cloudinaryApiSecret;

    if (!FINAL_GEMINI_KEY) throw createError({ statusCode: 500, message: '後端遺失 GEMINI_API_KEY' });

    const genAI = new GoogleGenerativeAI(FINAL_GEMINI_KEY);

    // --- E. 手動重新診斷模式 (僅邏輯計算，不寫入) ---
    if (action === 're_analyze') {
      const { question_text } = body;
      const current = subjectLibrary[subject] || subjectLibrary['樂理'];
      const model = genAI.getGenerativeModel({ model: FINAL_GEMINI_MODEL });
      const result = await model.generateContent(`你是一位專業的${current.role}... (略) \n 題目：${question_text}`);
      return { success: true, explanation: result.response.text().trim() };
    }

    // --- C. AI 分析模式 (上傳圖片 + 辨識) ---
    cloudinary.config({
      cloud_name: FINAL_CLOUDINARY_NAME,
      api_key: FINAL_CLOUDINARY_KEY,
      api_secret: FINAL_CLOUDINARY_SECRET
    });

    const model = genAI.getGenerativeModel({ 
      model: FINAL_GEMINI_MODEL, 
      generationConfig: { responseMimeType: "application/json" } 
    });

    let allQuestions = [];
    const seenNumbers = [];

    for (let i = 0; i < imageBatch.length; i++) {
      if (i > 0) await sleep(2000); 
      
    
      const base64ForCloudinary = `data:image/jpeg;base64,${imageBatch[i]}`;
      const res = await cloudinary.uploader.upload(base64ForCloudinary, { folder: 'allegro_theory' });
      
    
      const questionsFromImage = await analyzeExamPaper(imageBatch[i], i, model, body.mode, subject);
          
      if (Array.isArray(questionsFromImage)) {
        questionsFromImage.forEach(q => {
          if (!seenNumbers.includes(String(q.num))) {
            allQuestions.push({ ...q, imageUrl: res.secure_url }); 
            seenNumbers.push(String(q.num));
          }
        });
      }
    }

    return { success: true, data: allQuestions };

  } catch (error) {
    console.error('[Assignments API Error]', error);
    return { success: false, error: error.message };
  }
});

async function analyzeExamPaper(imageB64, index, model, mode = 'manual', subject = '樂理') {

  const current = subjectLibrary[subject] || subjectLibrary['樂理'];

  // 單題模式下，aiTaskDescription 要更精準
  const aiTaskDescription = mode === 'ai' 
    ? "這是一道【尚未批改】的題目。請辨識題目內容與學生的手寫答案，並由你判斷對錯。" 
    : "這是一道【老師已批改】的題目。請辨識題目、學生的手寫答案，以及老師的批改痕跡（勾選或劃掉）。";

  const prompt = `你是一位擁有精密視覺能力的${current.role}。
這張圖片是從【${subject}】考卷中裁切下來的「單一題目或數題」特寫，你的任務是將圖片內容「數位化」。

### ⚠️ 核心指令：字跡還原 (OCR Priority)
1. **字字珠璣**：請「逐字」轉錄圖片中的題目文字，包含題號、括號、選項 (A)(B)(C)(D)。
2. **禁止腦補**：僅輸出圖片中確實存在的文字。如果遇到筆跡遮擋，請盡力辨識，絕不可以用你記憶中類似的題目來替換。
3. **多行處理**：如果題目有選項，請用換行符號 \\n 保持原本的排版結構。

### 批改與邏輯任務：
- **正確答案 (correct_answer)**：
  - 優先順序 1：尋找圖中老師留下的「紅色修正字」。
  - 優先順序 2：若無紅字，請根據學科知識，從題目選項中選出唯一正確的答案。
- **掌握狀態 (is_mastered)**：
  - 若圖中有「打叉 ╳」、「斜撇 /」或紅字修正，設為 false。
  - 若圖中有「打勾 V」或「圈選」，設為 true。
- **AI 診斷 (explanation)**：
  - 簡短說明本題考查的${subject}核心概念。
  - 若學生答錯，請指出該錯誤選項的常見陷阱。
  - 語言限制：無論題目內容是否為英文，此欄位「必須」全程使用繁體中文進行解析與說明。

### 輸出格式 (嚴格 JSON)：
{
  "items": [
    {
      "num": "由圖片判斷，若無則填 ${index + 1}",
      "category": "從中選一: ${current.cats}",
      "original_text": "圖片中原始的完整文字 (含選項)",
      "correct_answer": "最終正確答案 (僅填寫代號或關鍵字)",
      "user_answer": "學生原始填寫的答案 (若無則空)",
      "is_mastered": true/false,
      "explanation": "針對該題的觀念解析"
    }
  ]
}`;

const result = await model.generateContent([
    prompt,
    { 
      inlineData: { 
        data: imageB64, 
        mimeType: "image/jpeg" 
      } 
    }
  ]);

  const response = await result.response;
  const cleanJson = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    const parsed = JSON.parse(cleanJson);
    return parsed.items || parsed;
  } catch (e) {
    console.error("AI 回傳格式錯誤:", cleanJson);
    return [];
  }
}

