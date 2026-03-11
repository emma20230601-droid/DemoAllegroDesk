import { readBody, createError, getQuery } from 'h3';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

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
    const { action, updates, title, imageBatch, testDate, notes, mode, subject, sessionId, userConfig } = body;
    
    // --- 🛡️ 1. 配置優先權解析 (門禁) ---
    const runtimeConfig = useRuntimeConfig(event);
    
    // 優先權：Body > Query > 門禁 userConfig > 環境變數
    const studentId = body.studentId || query.studentId;
    const incomingSheetId = body.sheetId || query.sheetId || userConfig?.sheet_id;
    
    // AI 門禁：前端傳入優先
    const FINAL_GEMINI_KEY = userConfig?.gemini_key || runtimeConfig.geminiApiKey;
    const FINAL_GEMINI_MODEL = runtimeConfig.geminiModel || "gemini-2.5-flash";
    const FINAL_CLOUDINARY_NAME = userConfig?.cloudinary_name || runtimeConfig.cloudinaryName;
    const FINAL_CLOUDINARY_KEY = userConfig?.cloudinary_api_key || runtimeConfig.cloudinaryApiKey;
    const FINAL_CLOUDINARY_SECRET = userConfig?.cloudinary_api_secret || runtimeConfig.cloudinaryApiSecret;

    if (!studentId) {
      throw createError({ statusCode: 400, message: '未提供 Student ID，系統無法定位個人資料表' });
    }

    // --- 📊 2. 整合 Google Sheets 憑證 (本機 + 雲端) ---
    let credentials = {};
    if (runtimeConfig.googleCredentials) {
      // 雲端模式
      credentials = typeof runtimeConfig.googleCredentials === 'string' 
        ? JSON.parse(runtimeConfig.googleCredentials) 
        : runtimeConfig.googleCredentials;
    } else {
      // 本機模式
      const configPath = path.resolve(process.cwd(), 'credentials.json');
      if (fs.existsSync(configPath)) {
        credentials = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } else {
        throw createError({ statusCode: 500, message: '找不到 Google 憑證設定' });
      }
    }

    const auth = new JWT({
      email: credentials.client_email,
      // 🚩 修正：處理私鑰換行問題，確保在 Vercel 正常解析
      key: credentials.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // --- 第一階段：身分動態定位 ---
    const registryTargetId = incomingSheetId || runtimeConfig.registrySheetId;
    const docRegistry = new GoogleSpreadsheet(registryTargetId, auth);
    await docRegistry.loadInfo();
    const registrySheet = docRegistry.sheetsByTitle['User_Registry'];
    
    let finalTargetId = null; 
    let finalTabName = null;

    if (registrySheet) {
      const registryRows = await registrySheet.getRows();
      const cleanSearchId = String(studentId).trim().toLowerCase();

      const studentEntry = registryRows.find(r => {
        const sId = String(r.get('student_id') || r.get('studentId') || '').trim().toLowerCase();
        const lCode = String(r.get('login_code') || '').trim().toLowerCase();
        return (sId !== '' && sId === cleanSearchId) || (lCode !== '' && lCode === cleanSearchId);
      });

      if (studentEntry) {
        finalTargetId = (studentEntry.get('sheet_id') || '').trim();
        finalTabName = (studentEntry.get('sheet_name') || '').trim();
        console.log(`[身分驗證成功] 學生: ${studentId} -> 目標試算表: ${finalTargetId}`);
      } else {
        throw createError({ statusCode: 404, message: `找不到學生 ${studentId} 的註冊資料` });
      }
    } else {
      throw createError({ statusCode: 500, message: '找不到 User_Registry 分頁' });
    }

    // --- 第二階段：連線到該學生的「個人專屬」試算表 ---
    const targetDoc = new GoogleSpreadsheet(finalTargetId, auth);
    await targetDoc.loadInfo();

    let sheet = targetDoc.sheetsByTitle[finalTabName] || 
                targetDoc.sheetsByTitle[subject] || 
                targetDoc.sheetsByIndex[0];

    if (!sheet) throw createError({ statusCode: 404, message: `無法定位有效的分頁` });

    // --- A. 更新模式 ---
    if (action === 'update') {
      const rows = await sheet.getRows();
      for (const updateItem of updates) {
        const row = rows.find(r => String(r.get('id')) === String(updateItem.id));
        if (row) {
          row.assign(updateItem);
          await row.save();
        }
      }
      return { success: true };
    }

    // --- B. 隨堂小考提交邏輯 ---
    if (action === 'quiz_submit') {
      if (!updates || updates.length === 0) throw createError({ statusCode: 400, message: '無資料可供寫入' });
      await sheet.addRows(updates);
      return { success: true, message: `已寫入紀錄至 ${sheet.title}` };
    }

    // --- D. 刪除模式 (修正點 1：確保刪除動作也對齊門禁解析後的 ID) ---
    if (action === 'deleteAssignment') {
      const { id, ids } = body;
      const rows = await sheet.getRows();
      let deletedCount = 0;

      // 統一轉為陣列處理
      const targetIds = Array.isArray(ids) ? ids : [id];
      const validIds = targetIds.map(v => String(v).trim()).filter(v => v !== '' && v !== 'undefined');

      for (const row of rows) {
        const rowId = String(row.get('id') || '').trim();
        // 💡 門禁檢查：除了 ID 匹配，可以增加 studentId 的校驗 (如果 Row 裡面有存的話)
        if (rowId !== '' && validIds.includes(rowId)) {
          await row.delete();
          deletedCount++;
        }
      }
      return { success: true, message: `已成功刪除 ${deletedCount} 筆資料` };
    }

    // --- E. 手動重新診斷模式 (修正點 2：確保 Model 變數一致) ---
    if (action === 're_analyze') {
      const { question_text, correct_answer, subject: sub } = body;
      const safeQuestionText = cleanOcrText(question_text);
      const current = subjectLibrary[sub] || subjectLibrary['樂理'];
      const rePrompt = `你是一位專業的${current.role}...`;
      
      const genAI = new GoogleGenerativeAI(FINAL_GEMINI_KEY);
      // 💡 修正：使用門禁解析後的 FINAL_GEMINI_MODEL
      const model = genAI.getGenerativeModel({ model: FINAL_GEMINI_MODEL }); 
      const result = await model.generateContent(rePrompt);
      const response = await result.response;
      return { success: true, explanation: response.text().trim() };
    }

    // --- C. AI 分析模式 (上傳圖片) ---
    if (!FINAL_GEMINI_KEY) throw createError({ statusCode: 500, message: '後端遺失 GEMINI_API_KEY' });

    cloudinary.config({
      cloud_name: FINAL_CLOUDINARY_NAME,
      api_key: FINAL_CLOUDINARY_KEY,
      api_secret: FINAL_CLOUDINARY_SECRET
    });

    const genAI = new GoogleGenerativeAI(FINAL_GEMINI_KEY);
    const model = genAI.getGenerativeModel({ 
      model: FINAL_GEMINI_MODEL, 
      generationConfig: { responseMimeType: "application/json" } 
    });

    let allQuestions = [];
    const seenNumbers = [];

    for (let i = 0; i < imageBatch.length; i++) {
      if (i > 0) await sleep(3000); 
      const res = await cloudinary.uploader.upload(imageBatch[i], { folder: 'allegro_theory' });
      const currentImageUrl = res.secure_url;
      const questionsFromImage = await analyzeExamPaper(imageBatch[i], i, model, mode, subject, seenNumbers); 
      if (Array.isArray(questionsFromImage)) {
        questionsFromImage.forEach(q => {
          const qNum = String(q.num).trim();
          if (!seenNumbers.includes(qNum)) {
            allQuestions.push({ ...q, imageUrl: currentImageUrl }); 
            seenNumbers.push(qNum);
          }
        });
      }
    }

    if (allQuestions.length > 0) {
      const scanTimestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
      const rowsToAdd = allQuestions.map((q, idx) => {
        const cleanedText = cleanOcrText(q.original_text);
        return {
          'id': `${Date.now()}-${idx}`,
          'sessionId': sessionId || '',
          'studentId': studentId,
          'date': testDate || scanTimestamp.split(' ')[0],
          'scan_date': scanTimestamp,
          'category': q.category,
          'title': title,
          'question_key': `${title} - 第 ${q.num} 題`,
          'correct_answer': q.correct_answer,
          'user_answer': q.user_answer,
          'knowledge_point': notes ? `[註記：${notes}] ${cleanedText}` : cleanedText,
          'ai_explanation': q.explanation,
          'image_url': q.imageUrl,
          'is_mastered': String(q.user_answer).trim() === String(q.correct_answer).trim() ? 'TRUE' : 'FALSE'
        };
      });
      await sheet.addRows(rowsToAdd);
      return { success: true, data: rowsToAdd };
    }
    return { success: true, data: [] };

  } catch (error) {
    console.error('[Assignments API Error]', error);
    return { success: false, error: error.message };
  }
});
// ✨ 修正：在參數列加入 existingQuestions = [] (預設值防止未傳入時報錯)
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
    { inlineData: { data: imageB64.split(',')[1], mimeType: "image/jpeg" } }
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

// 🚿 文字清洗工具：專門處理社會科等長文字斷行問題
function cleanOcrText(text) {
  if (!text) return '';
  return text
    // 1. 移除中文字與中文字之間的斷行（處理社會科裁切後的碎裂感）
    .replace(/([\u4e00-\u9fa5,，。？！、])\n+([\u4e00-\u9fa5])/g, '$1$2')
    // 2. 移除重複出現的疊字（OCR 常見錯誤，如：什麼 麼 -> 什麼）
    .replace(/([^ \n])\n+(?=\1)/g, '')
    // 3. 確保選項 ①②③④ 前面有換行，後方有一個空格，讓 Excel 閱讀舒適
    .replace(/\s*([①-⑩])\s*/g, '\n$1 ')
    // 4. 移除多餘的連續空格
    .replace(/ +/g, ' ')
    .trim();
}
