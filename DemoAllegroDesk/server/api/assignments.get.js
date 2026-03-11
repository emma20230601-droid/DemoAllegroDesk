import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event);
    const query = getQuery(event);
    
    // --- 🛡️ 1. 核心門禁：整合 Google Sheets 憑證 (本機 + 雲端) ---
    let credentials = {};
    const envCreds = config.googleCredentials;

    // 💡 策略：優先尋找環境變數 (Cloud)，若無則讀取實體檔案 (Local)
    if (envCreds) {
      credentials = typeof envCreds === 'string' ? JSON.parse(envCreds) : envCreds;
    } else {
      const configPath = path.resolve(process.cwd(), 'credentials.json');
      if (fs.existsSync(configPath)) {
        credentials = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } else {
        throw createError({ statusCode: 500, message: '伺服器遺失 Google 憑證 (Credentials)' });
      }
    }

    // 🚩 修正：處理私鑰換行問題，確保在任何環境（Vercel/Docker）都能正確解析
    const formattedPrivateKey = credentials.private_key
      ? credentials.private_key.replace(/\\n/g, '\n')
      : null;

    if (!formattedPrivateKey) {
      throw createError({ statusCode: 500, message: '憑證中遺失 Private Key' });
    }

    const auth = new JWT({
      email: credentials.client_email,
      key: formattedPrivateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // --- 🛡️ 2. 參數門禁化 ---
    const registryId = config.registrySheetId;
    if (!registryId) {
      throw createError({ statusCode: 500, message: '伺服器配置錯誤：缺少 Registry ID' });
    }

    // 取得參數，移除空白並標準化
    const studentId = query.studentId ? String(query.studentId).replace(/\s/g, '') : null;
    const incomingSheetId = query.sheetId || registryId;
    const incomingTabName = query.tabName || query.sheet_name;

    // --- 3. 連接 Registry 表 (邏輯保留) ---
    const doc = new GoogleSpreadsheet(registryId, auth);
    await doc.loadInfo();

    const registrySheet = doc.sheetsByTitle['User_Registry'];
    let students = []; 
    let targetSheetName = incomingTabName || 'Emma'; 

    if (registrySheet) {
      const registryRows = await registrySheet.getRows();
      
      students = registryRows.map(r => ({
        id: r.get('login_code') ? String(r.get('login_code')).replace(/\s/g, '').toLowerCase() : '', 
        student_id: r.get('student_id') ? String(r.get('student_id')).trim() : '', 
        name: r.get('student_name') || '未命名',
        sheet: r.get('sheet_name') ? String(r.get('sheet_name')).replace(/\s/g, '') : '',
        role: r.get('role') ? String(r.get('role')).trim().toLowerCase() : 'student',
        sheet_id: r.get('sheet_id') ? String(r.get('sheet_id')).trim() : ''
      }));

      // 匹配當前學生，自動動態定位 targetSheetName
      if (studentId && studentId !== 'all') {
        const cleanQueryId = studentId.toLowerCase();
        const found = students.find(s => s.id === cleanQueryId || s.student_id === cleanQueryId);
        if (found && found.sheet) {
          targetSheetName = found.sheet;
        }
      }
    }

    // --- 4. 定位目標資料表 ---
    let sheet; 
    const isExternalSheet = incomingSheetId && incomingSheetId !== registryId;
    const targetDoc = isExternalSheet ? new GoogleSpreadsheet(incomingSheetId, auth) : doc;

    if (isExternalSheet) {
      await targetDoc.loadInfo();
      sheet = incomingTabName ? targetDoc.sheetsByTitle[incomingTabName] : targetDoc.sheetsByIndex[0];
    } else {
      sheet = targetDoc.sheetsByTitle[targetSheetName];
    }

    // 二次防禦：回退機制
    if (!sheet) {
      console.warn(`⚠️ 找不到指定分頁 [${targetSheetName}]，自動回退至第一張分頁`);
      sheet = targetDoc.sheetsByIndex[0];
    }

    // 確保標題列載入
    try {
      await sheet.loadHeaderRow();
    } catch (e) {
      throw createError({ 
        statusCode: 400, 
        message: `讀取分頁 [${sheet.title}] 失敗：請確認分頁內容是否正確。` 
      });
    }

    // --- 5. 抓取資料 (map 邏輯完全保留) ---
    const rows = await sheet.getRows();
    const questions = rows.map(row => ({
      id: row.get('id'),
      date: row.get('date'),
      category: row.get('category'), 
      question_key: row.get('question_key'),
      correct_answer: row.get('correct_answer'),
      user_answer: row.get('user_answer'),
      title: row.get('title') || row.get('卷別') || '',
      knowledge_point: row.get('knowledge_point'),
      ai_explanation: row.get('ai_explanation'),
      image_url: row.get('image_url'),
      is_mastered: row.get('is_mastered')
    })).filter(q => q.date).reverse(); // 保持反轉順序，最新優先

    return { success: true, questions, students };

  } catch (error) {
    console.error('[Assignments GET Error]', error.message);
    throw createError({ statusCode: 500, message: error.message });
  }
});
