import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

export default defineEventHandler(async (event) => {
  try {
    const runtimeConfig = useRuntimeConfig(event);
    const { studentId, sheetId: querySheetId } = getQuery(event);

    if (!studentId) return { success: false, error: '缺少 Student ID' };

    // --- 🛡️ 🟢 1. 憑證與門禁處理區 (參考 quiz-submit 徹底整合) ---
    let credentials = {};
    if (runtimeConfig.googleCredentials) {
      // 🚩 雲端模式：優先從環境變數讀取 (Vercel)
      credentials = typeof runtimeConfig.googleCredentials === 'string' 
        ? JSON.parse(runtimeConfig.googleCredentials) 
        : runtimeConfig.googleCredentials;
    } else {
      // 🚩 本機模式：讀取實體 credentials.json
      const configPath = path.resolve(process.cwd(), 'credentials.json');
      if (fs.existsSync(configPath)) {
        credentials = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } else {
        // 拋出標準錯誤，與 quiz-submit 的門禁提示一致
        throw createError({ statusCode: 500, message: '找不到 Google 憑證設定 (線上變數或本機檔案)' });
      }
    }

    const auth = new JWT({
      email: credentials.client_email,
      // 🚩 關鍵修正：確保私鑰換行符號在不同環境下均能正確解析
      key: credentials.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    // --- 🛡️ 門禁處理結束 ---

    // --- 🟢 2. 定位 Registry 並尋找學生 (保持原功能) ---
    const targetId = querySheetId || runtimeConfig.registrySheetId;
    const registryDoc = new GoogleSpreadsheet(targetId, auth);
    await registryDoc.loadInfo();
    const registrySheet = registryDoc.sheetsByTitle['User_Registry'];
    
    if (!registrySheet) return { success: false, error: '找不到 User_Registry 分頁' };

    const rows = await registrySheet.getRows();
    const found = rows.find(r => 
      String(r.get('student_id') || '').trim().toLowerCase() === String(studentId).trim().toLowerCase() ||
      String(r.get('login_code') || '').trim().toLowerCase() === String(studentId).trim().toLowerCase()
    );

    if (!found) return { success: false, error: `找不到學生 ${studentId}` };

    // --- 🟢 3. 鎖定個人表與分頁名稱 (優化配額消耗) ---
    const personalSheetId = (found.get('sheet_id') || '').trim() || targetId;
    const studentName = (found.get('sheet_name') || found.get('student_name') || 'Student').trim();
    
    // 🚩 指向個人診斷分頁
    const targetSheetName = `${studentName}_Clinic`; 

    const personalDoc = new GoogleSpreadsheet(personalSheetId, auth);
    await personalDoc.loadInfo();

    const sheet = personalDoc.sheetsByTitle[targetSheetName];
    
    let allBugs = [];
    if (sheet) {
      const rows = await sheet.getRows();
      allBugs = rows.filter(r => {
        const m = String(r.get('is_mastered') || '').trim().toUpperCase();
        const t = String(r.get('title') || '').trim();
        // 過濾掉已精通或空標題的資料
        return m !== 'TRUE' && t !== ''; 
      }).map(r => ({
        id: `${studentName}-${r.rowNumber}`,
        subject: r.get('subject') || (sheet.title.includes('_') ? sheet.title.split('_')[0] : '未分類'),
        category: r.get('tags') || '一般',
        title: r.get('title'),
        summary: r.get('summary') || '',
        date: r.get('date') || '2024-01-01'
      }));
    } else {
        console.warn(`[Clinic All] 找不到分頁: ${targetSheetName}`);
    }

    // --- 🟢 4. 排序並回傳 ---
    allBugs.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { 
      success: true, 
      data: allBugs,
      info: { tabUsed: targetSheetName } 
    };

  } catch (e) {
    console.error('[Clinic All API Error]:', e.message);
    // 針對 Google API 限制與標準錯誤進行捕捉
    if (e.message.includes('429')) {
        return { success: false, error: 'Google API 次數達到上限，請稍後再試。' };
    }
    // 透過 createError 噴出錯誤，讓前端能明確接收到狀態
    throw createError({ statusCode: 500, message: e.message });
  }
});
