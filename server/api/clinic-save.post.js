import { readBody, createError } from 'h3';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
 const config = useRuntimeConfig(event);

  try {
    const body = await readBody(event);
    const { studentId, subject, title, diagnosis, sheetId: bodySheetId } = body;

    // --- 🛡️ 核心門禁：整合本機與雲端憑證邏輯 ---
    let credentials = {};
    
    // 🚩 優先順序 1：檢查雲端環境變數 (Vercel)
    if (config.googleCredentials) {
      credentials = typeof config.googleCredentials === 'string' 
        ? JSON.parse(config.googleCredentials) 
        : config.googleCredentials;
    } 
    // 🚩 優先順序 2：讀取本機 credentials.json
    else {
      const configPath = path.resolve(process.cwd(), 'credentials.json');
      if (fs.existsSync(configPath)) {
        credentials = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } else {
        throw createError({ 
          statusCode: 500, 
          statusMessage: '找不到 Google 憑證設定 (環境變數或 credentials.json)' 
        });
      }
    }

    // 🚩 核心修正：處理私鑰換行符號，確保 JWT 認證在任何環境都能解析
    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    // --- 🛡️ 門禁處理結束 ---
    
    // 2. 決定 Registry 位置 (保持不變)
    const registryTargetId = bodySheetId || config.registrySheetId;
    const docRegistry = new GoogleSpreadsheet(registryTargetId, auth);
    await docRegistry.loadInfo();
    const registrySheet = docRegistry.sheetsByTitle['User_Registry'];
    
    const rows = await registrySheet.getRows();
    const entry = rows.find(r => 
      (r.get('student_id') || '').toString().trim() === studentId.toString().trim()
    );

    if (!entry) throw new Error(`找不到學生 ${studentId} 的註冊資訊`);

    const personalSheetId = entry.get('sheet_id');
    const studentNameFromRegistry = entry.get('sheet_name') || entry.get('student_name') || 'Student';
    
    // 4. 連向個人試算表
    const personalDoc = new GoogleSpreadsheet(personalSheetId, auth);
    await personalDoc.loadInfo();

    const sheetName = `${studentNameFromRegistry.trim()}_Clinic`;
    let clinicSheet = personalDoc.sheetsByTitle[sheetName];

    if (!clinicSheet) {
      clinicSheet = await personalDoc.addSheet({ 
        title: sheetName, 
        headerValues: ['date', 'subject', 'title', 'summary', 'tags', 'actions', 'wrongIds', 'quizzes', 'is_mastered', 'quiz_results'] 
      });
    }

    const dateStr = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
    const isMasteredStr = (diagnosis.is_mastered === true || String(diagnosis.is_mastered).toUpperCase() === 'TRUE') ? 'TRUE' : 'FALSE';
    const finalTitle = (title || diagnosis.title || '全部卷別').trim();

    // 5. 執行 Clinic 分頁的「更新或新增」邏輯
    const clinicRows = await clinicSheet.getRows();
    const existingRow = clinicRows.find(r => {
      const rowSubject = String(r.get('subject') || '').replace(/\s+/g, '').trim();
      const rowTitle = String(r.get('title') || '').replace(/\s+/g, '').trim();
      return rowSubject === subject.trim() && rowTitle === finalTitle.replace(/\s+/g, '').trim();
    });

    // --- 🚩 關鍵修改：版本合併邏輯 ---
    let finalQuizzes = {};
    let finalResults = {};

    if (existingRow) {
      // 讀取原本在 Excel 裡的舊資料
      try {
        finalQuizzes = JSON.parse(existingRow.get('quizzes') || '{}');
        finalResults = JSON.parse(existingRow.get('quiz_results') || '{}');
      } catch (e) {
        finalQuizzes = {};
        finalResults = {};
      }

      // 如果傳進來的是版本化結構 { v1: {}, v2: {} }，直接 Merge
      // 如果傳進來的是單一版本，則依據當前長度自動給予版本號
      if (diagnosis.quizzes) {
        if (diagnosis.quizzes.v1) {
          // 情況 A: 前端已經處理好版本 (v1, v2...)，直接合併
          finalQuizzes = { ...finalQuizzes, ...diagnosis.quizzes };
          finalResults = { ...finalResults, ...diagnosis.quiz_results };
        } else {
          // 情況 B: 前端傳來的是單一陣列/物件，後端幫忙轉版
          const nextVer = `v${Object.keys(finalQuizzes).length + 1}`;
          finalQuizzes[nextVer] = diagnosis.quizzes;
          finalResults[nextVer] = diagnosis.quiz_results || [];
        }
      }
    } else {
      // 完全沒紀錄時，建立初始版本
      finalQuizzes = diagnosis.quizzes?.v1 ? diagnosis.quizzes : { v1: diagnosis.quizzes || [] };
      finalResults = diagnosis.quiz_results?.v1 ? diagnosis.quiz_results : { v1: diagnosis.quiz_results || [] };
    }

    const rowData = {
      date: dateStr,
      subject: subject,
      title: finalTitle,
      summary: diagnosis.summary || '',
      tags: JSON.stringify(diagnosis.tags || []),
      actions: JSON.stringify(diagnosis.actions || []),
      wrongIds: JSON.stringify(diagnosis.wrongIds || []),
      quizzes: JSON.stringify(finalQuizzes), // 儲存合併後的版本物件
      is_mastered: isMasteredStr,
      quiz_results: JSON.stringify(finalResults) // 儲存合併後的結果物件
    };

    // 執行儲存
    if (existingRow) {
      Object.keys(rowData).forEach(key => {
        existingRow.set(key, rowData[key]);
      });
      await existingRow.save();
    } else {
      await clinicSheet.addRow(rowData);
    }

    return { 
      success: true, 
      message: existingRow ? '診斷版本已更新' : '新診斷已封存',
      currentVersion: `v${Object.keys(finalQuizzes).length}` 
    };

  } catch (error) {
    console.error('[Clinic Save Error]:', error.message);
    return { success: false, error: error.message };
  }
});
