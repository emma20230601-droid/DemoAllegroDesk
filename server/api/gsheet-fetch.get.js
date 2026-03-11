import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const config = useRuntimeConfig(event);
  let { studentId, sheetId, range } = query;

  try {
    const isActuallyValid = (id) => {
      return id && 
             id.length > 20 && 
             !/[\u4e00-\u9fa5]/.test(id) && 
             id !== 'undefined' && 
             id !== 'null';
    };

    let targetId = isActuallyValid(sheetId) ? sheetId : null;

    if (!targetId) {
      if (!studentId) throw new Error('ID 格式錯誤且未提供學號，無法解析資料');
      const usersResponse = await $fetch('/api/assignments', { params: { studentId } });
      const allStudents = usersResponse.students || [];
      const user = allStudents.find(u => 
        String(u.id).toLowerCase() === String(studentId).toLowerCase() || 
        String(u.student_id).toLowerCase() === String(studentId).toLowerCase()
      );
      if (!user) throw new Error(`在註冊表中找不到學號 ${studentId}`);
      const possibleId = user.sheet_id || user.sheet;
      if (!isActuallyValid(possibleId)) throw new Error(`學員 ${studentId} 缺少有效的試算表 ID`);
      targetId = possibleId;
    }


// ... 前面的 targetId 邏輯維持不變 ...

    // 1. Google Auth 初始化 (修正版)
    let credentials = {};
    if (config.googleCredentials) {
      // 🚩 優先從 Vercel 環境變數讀取
      credentials = typeof config.googleCredentials === 'string' 
        ? JSON.parse(config.googleCredentials) 
        : config.googleCredentials;
    } else {
      // 🚩 本地開發環境：讀取實體檔案
      const configPath = path.resolve(process.cwd(), 'credentials.json');
      if (fs.existsSync(configPath)) {
        credentials = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } else {
        throw createError({ statusCode: 500, message: '找不到 Google 憑證設定' });
      }
    }

    const auth = new JWT({
      email: credentials.client_email,
      // 🚩 重要：這裡一定要處理換行
      key: credentials.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // ✨ 實例化 doc 並加載資訊
    const doc = new GoogleSpreadsheet(targetId, auth);
    // ... 後面邏輯維持不變 ...
    await doc.loadInfo();
    
    // 判斷請求類型
    const isQuizResults = range && range.includes('QuizResults');
    const targetSheetName = isQuizResults ? 'QuizResults' : 'Sessions';
    
    const sheet = doc.sheetsByTitle[targetSheetName];
    if (!sheet) throw new Error(`找不到名為 [${targetSheetName}] 的分頁`);
    
    const rows = await sheet.getRows();

    // 1. 如果是 QuizResults 模式 (新功能)
    if (isQuizResults) {
      return rows.map(r => ({
        sessionId: r.get('sessionId') || r.get('SessionID'),
        Score: r.get('Score') || r.get('ScoreIs'),
        Topic: r.get('Topic'),
        StudentId: r.get('StudentId'),
        StudentName: r.get('StudentName'),
        Timestamp: r.get('Timestamp'),
        QuizJSON: r.get('QuizJSON')
      }));
    }

    // 2. 映射回傳資料 (完全還原原本格式，包含 Points 大寫)
return rows.map(r => {
  const uName = r.get('UserName') || '';
  const sId = r.get('student_id') || r.get('StudentId') || '';

  return {
    sessionId: r.get('sessionId') || r.get('SessionID') || '',
    Date: r.get('Date') || '',
    Topic: r.get('Topic') || '',
    Category: r.get('Category') || '',
    Points: r.get('Points') || '', 
    QuizMode: r.get('QuizMode') || '',
    QuizJSON: r.get('QuizJSON') || '',
    QuizTitle: r.get('QuizTitle') || '',
    // 關鍵：保留原始的 UserName，不要強制塞入 ID，否則前端分不出是老師還是學生
    UserName: uName, 
    studentId: sId
  };
});

  } catch (e) {
    console.error("[GSheet Fetch Error]:", e.message);
    throw createError({
      statusCode: 400,
      statusMessage: e.message
    });
  }
});
