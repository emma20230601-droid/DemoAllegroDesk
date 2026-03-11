import { readBody, createError } from 'h3';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// --- ✨ 1. AI 出題邏輯：根據重點生成 3~5 題 ---
async function generateAIQuiz(points, category, model, quizMode = 'ai', count = 10) {
  console.log(`[Gemini AI] 正在以「${quizMode}」模式生成 ${count} 題測驗...`);
  
  // 🚀 核心改動：根據模式定義不同的出題引導
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
    const { action, sessionData, userConfig, studentId, imageBase64, imagesArray } = body;

    // --- 🛡️ 1. 配置優先權解析 (門禁) ---
    const runtimeConfig = useRuntimeConfig(event);
    
    // 💡 門禁優先級：前端傳入 > 環境變數
    const FINAL_GEMINI_KEY = userConfig?.gemini_key || runtimeConfig.geminiApiKey;
    const FINAL_SHEET_ID = userConfig?.sheet_id || runtimeConfig.googleSheetId;
    const FINAL_MODEL = runtimeConfig.geminiModel || "gemini-2.5-flash"; 

    if (!FINAL_GEMINI_KEY || !FINAL_SHEET_ID) {
      throw createError({ statusCode: 400, message: '遺失配置資訊 (Key 或 Sheet ID)' });
    }

// --- ✨ 1. 初始化 AI 模型 ---
    const genAI = new GoogleGenerativeAI(FINAL_GEMINI_KEY);
    const model = genAI.getGenerativeModel({ 
      model: FINAL_MODEL, 
      generationConfig: { responseMimeType: "application/json" } 
    });

    // --- 📸 情況：analyzeVision ---
    if (action === 'analyzeVision') {
      // 1. 接收前端傳來的資料（包含活的學科配置）
      const { imagesArray, imageBase64, subjectConfigs, userConfig } = body;
      const finalImages = imagesArray || (imageBase64 ? [imageBase64] : []);
      if (finalImages.length === 0) throw new Error('未接收到圖片數據');
      
      // ✨ 修正：使用穩定支援多圖的模型
  
      if (!FINAL_GEMINI_KEY) throw createError({ statusCode: 500, message: '後端遺失 GEMINI_API_KEY' });
      const genAI = new GoogleGenerativeAI(FINAL_GEMINI_KEY);
      const model = genAI.getGenerativeModel({ 
        model: FINAL_MODEL, 
        generationConfig: { responseMimeType: "application/json" } 
      });


      // 🔄 2. 動態生成分類清單，讓 AI 知道有哪些選項
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

      const result = await model.generateContent([
        visionPrompt,
        ...imageParts
      ]);

      const responseText = result.response.text().replace(/```json|```/g, '').trim();
      
      // 解析後回傳，前端就會收到 category, topic, points
      return { success: true, data: JSON.parse(responseText) };
    }

// --- 📊 3. 整合 Google Sheets 憑證 (本機 + 雲端) ---
    let credentials = {};

    if (runtimeConfig.googleCredentials) {
      // 🚩 雲端模式：從 Vercel / runtimeConfig 讀取
      credentials = typeof runtimeConfig.googleCredentials === 'string' 
        ? JSON.parse(runtimeConfig.googleCredentials) 
        : runtimeConfig.googleCredentials;
    } else {
      // 🚩 本機模式：讀取實體 credentials.json
      const configPath = path.resolve(process.cwd(), 'credentials.json');
      if (fs.existsSync(configPath)) {
        credentials = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } else {
        throw createError({ statusCode: 500, message: '找不到 Google 憑證設定 (線上環境變數或本機 JSON)' });
      }
    }

    // 💡 統一建立 JWT Auth，並處理 Private Key 的換行字元 (Vercel 必備)
    const jwtAuth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key.replace(/\\n/g, '\n'), 
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 🚀 使用解析後的 FINAL_SHEET_ID 啟動試算表
    const doc = new GoogleSpreadsheet(FINAL_SHEET_ID, jwtAuth);
    await doc.loadInfo();

    // --- 4. 接下來繼續執行原本的 Action 判斷 ---
    const sessionSheet = doc.sheetsByTitle['Sessions'];
    if (!sessionSheet) throw createError({ statusCode: 404, message: '找不到雲端 Sessions 分頁' });

    // --- 情況 A：存入測驗結果 (保持不變) ---
    if (action === 'saveResult' || action === 'quiz_submit') {
      const resultSheet = doc.sheetsByTitle['QuizResults'];
      if (resultSheet) {
        await resultSheet.addRow({
          Timestamp: new Date().toLocaleString('zh-TW'),
          StudentID: studentId || '',
          StudentName: userConfig.userName || 'Unknown',
          Topic: sessionData.topic,
          Result: sessionData.isCorrect ? 'Correct' : 'Incorrect',
          Feedback: sessionData.feedback || ''
        });
      }
      return { success: true };
    }

// --- 情況 B：發布今日紀錄 ---
    if (action === 'publishSession') {

      if (!FINAL_GEMINI_KEY) throw createError({ statusCode: 500, message: '後端遺失 GEMINI_API_KEY' });
      const genAI = new GoogleGenerativeAI(FINAL_GEMINI_KEY);
      const model = genAI.getGenerativeModel({ 
        model: FINAL_MODEL, 
        generationConfig: { responseMimeType: "application/json" } 
      });



      // ✨ 傳入 quizMode
      const finalQuizContent = await generateAIQuiz(
        sessionData.points, 
        sessionData.category || '全科', 
        model,
        sessionData.quizMode, // 🚀 從前端傳來的模式
        sessionData.quizCount // 👈 傳入題數
      );

      const finalstudent_id = userConfig.student_id || sessionData.student_id || 'Anonymous';
      
      // 1. 寫入總表
      const rowData = {
        sessionId: sessionData.sessionId || ('SID-' + Date.now()),
        Date: sessionData.date || new Date().toLocaleDateString('en-US'),
        Topic: sessionData.topic,
        Category: sessionData.category, // ✨ 這裡確保 Category 有值
        Points: JSON.stringify(sessionData.points),
        QuizTitle: sessionData.quizTitle || '隨堂小挑戰',
        QuizMode: sessionData.quizMode,
        QuizJSON: JSON.stringify(finalQuizContent),
        student_id: finalstudent_id,
        totalQuestions: sessionData.quizCount || 10
      };
      await sessionSheet.addRow(rowData);

      // 2. ✨ 修正重點：同時寫入個人的分頁（解決你目錄顯示未分類的問題）
      const studentSheet = doc.sheetsByTitle[finalstudent_id];
      if (studentSheet) {
        await studentSheet.addRow({
          Date: rowData.Date,
          Topic: rowData.Topic,
          Category: rowData.Category, // 🚀 直接拿上面的 Category 寫入個人表單
          Status: '已發布'
        });
      }

      return { success: true, quizGenerated: finalQuizContent, totalQuestions: rowData.totalQuestions };
    }

// --- 情況 C：刷新測驗並回寫資料表 ---
if (action === 'refreshQuiz') {
      // 1. AI 模型初始化 (維持原樣)
      if (!FINAL_GEMINI_KEY) throw createError({ statusCode: 500, message: '後端遺失 GEMINI_API_KEY' });
      const genAI = new GoogleGenerativeAI(FINAL_GEMINI_KEY);
      const model = genAI.getGenerativeModel({ 
        model: FINAL_MODEL, 
        generationConfig: { responseMimeType: "application/json" } 
      });

      // 2. 抓取資料列
      const rows = await sessionSheet.getRows();
      const targetSessionRow = rows.find(r => r.get('sessionId') === sessionData.sessionId);

      // 3. ✨ 修正：優先使用前端傳來的「新設定」
      // 如果 sessionData.quizMode 有值，代表使用者在 UI 改了難度
      const finalMode = sessionData.quizMode || targetSessionRow?.get('QuizMode') || 'concept';
      
      // ✨ 修正：參數名稱對接 (前端傳的是 questionCount)
      const finalCount = sessionData.questionCount || 10;

      const finalQuizContent = await generateAIQuiz(
        sessionData.points, 
        sessionData.category || '全科', 
        model,
        finalMode,   // 使用最新的模式
        finalCount   // 使用最新的題數
      );

      // 4. 更新總表 Sessions
      if (targetSessionRow) {
        targetSessionRow.set('QuizJSON', JSON.stringify(finalQuizContent));
        
        // ✨ 關鍵：同步把新的題數存入試算表，否則下次讀取又是舊的
        targetSessionRow.set('totalQuestions', finalCount); 
        
        // 如果有 QuizMode 也一併更新
        if (sessionData.quizMode) {
          targetSessionRow.set('QuizMode', sessionData.quizMode);
        }
        
        await targetSessionRow.save();
      }
      // 5. 更新個人表單
      const finalstudent_id = userConfig.student_id || sessionData.student_id || 'Anonymous';
      const studentSheet = doc.sheetsByTitle[finalstudent_id];
      
      if (studentSheet) {
        const studentRows = await studentSheet.getRows();
        const targetStudentRow = studentRows.find(r => 
          r.get('Topic') === sessionData.topic && 
          r.get('Date') === (sessionData.date || targetSessionRow?.get('Date'))
        );

        if (targetStudentRow) {
          targetStudentRow.set('Status', '題目已更新');
          targetStudentRow.set('Category', sessionData.category); 
          await targetStudentRow.save();
        } else {
          await studentSheet.addRow({
            Date: sessionData.date || new Date().toLocaleDateString('en-US'),
            Topic: sessionData.topic,
            Category: sessionData.category,
            Status: '已發布(更新)'
          });
        }
      }

      return { 
        success: true, 
        quizGenerated: finalQuizContent,
        appliedMode: finalMode,  // 回傳讓前端確認
        totalQuestions: finalCount, // 回傳讓前端確認
      };
    }

// --- 情況 D：刪除紀錄 (比照其餘 action 邏輯) ---
    if (action === 'deleteSession') {
      const rows = await sessionSheet.getRows();
      // 🚩 根據唯一的 sessionId 尋找
      const targetRow = rows.find(r => r.get('sessionId') === sessionData.sessionId);
      
      if (targetRow) {
        await targetRow.delete();
        console.log(`[Delete Success] SessionId: ${sessionData.sessionId}`);
        return { success: true };
      } else {
        // 找不到也沒關係，回傳成功讓前端移除畫面的「孤兒卡片」
        return { success: true, message: '雲端無紀錄，已同步移除本地顯示' };
      }
    }

// --- 情況 E：更新紀錄內容 ---
    if (action === 'updateSession') {
      // 1. 先抓取所有資料
      const rows = await sessionSheet.getRows();
      
      // 2. ✨ 先宣告變數 (Initialization)
      // 根據唯一的 sessionId 尋找
      const targetRow = rows.find(r => r.get('sessionId') === sessionData.sessionId);
      
      // 3. ✨ 宣告完之後，才能進行判斷與存取 (Access)
      if (!targetRow) {
        // 改用回傳而不是 throw，能讓前端 showAlert 抓到錯誤訊息
        return { success: false, error: '找不到該筆紀錄，無法更新' };
      }

      const oldTopic = targetRow.get('Topic');
      const rowDate = targetRow.get('Date');

      // 4. 執行更新
      targetRow.set('Topic', sessionData.topic);
      targetRow.set('Points', Array.isArray(sessionData.points) 
        ? JSON.stringify(sessionData.points) 
        : sessionData.points
      );
      
      await targetRow.save();

      // 同步更新個人分頁 (保持你原本的邏輯)
      const finalstudent_id = userConfig.student_id || sessionData.student_id;
      if (finalstudent_id && finalstudent_id !== 'teacher') {
        try {
          const studentSheet = doc.sheetsByTitle[finalstudent_id];
          if (studentSheet) {
            const studentRows = await studentSheet.getRows();
            const targetStudentRow = studentRows.find(r => 
              String(r.get('Topic')) === String(oldTopic) && 
              String(r.get('Date')) === String(rowDate)
            );
            if (targetStudentRow) {
              targetStudentRow.set('Topic', sessionData.topic);
              await targetStudentRow.save();
            }
          }
        } catch (e) {
          console.error("個人分頁同步失敗:", e);
        }
      }

      console.log(`[Update Success] SessionId: ${sessionData.sessionId}`);
      return { success: true };
    }

  } catch (error) {
    console.error('[Sessions API Error]', error);
    return { success: false, error: error.message };
  }
});
