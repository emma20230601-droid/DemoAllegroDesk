import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  // 保持原本解構，加入 userConfig 以支援門禁 ID 判斷
  const { sessionId, studentId, studentName, sheetId, topic, score, isCorrect, userConfig } = body;
  const runtimeConfig = useRuntimeConfig(event);

  // 1. 安全導航：優先順序 = 前端傳入 sheetId > 門禁 userConfig > 環境變數
  const targetSheetId = sheetId || userConfig?.sheet_id || runtimeConfig.googleSheetId || runtimeConfig.registrySheetId;

  try {
    // --- 🛡️ 門禁與憑證處理區 (整合本機與雲端) ---
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
        throw createError({ statusCode: 500, message: '找不到 Google 憑證設定 (線上變數或本機檔案)' });
      }
    }

    const auth = new JWT({
      email: credentials.client_email,
      // 🚩 修正：處理私鑰換行問題，確保在 Vercel 正常解析
      key: credentials.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    // --- 🛡️ 門禁處理結束 ---

    const doc = new GoogleSpreadsheet(targetSheetId, auth);
    await doc.loadInfo();

    // 2. 尋找 QuizResults 分頁
    const sheet = doc.sheetsByTitle['QuizResults'];
    if (!sheet) throw new Error('找不到 [QuizResults] 分頁，請在 Google Sheets 建立它');

    // 3. 寫入 (對應你要求的欄位名)
    // 注意：這裡的 Key 必須與試算表第一列標題完全一致
    await sheet.addRow({
      Timestamp: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
      sessionId: sessionId,
      studentId: studentId,
      StudentName: studentName,
      Topic: topic,
      Score: score,
      IsCorrect: isCorrect ? 'TRUE' : 'FALSE'
    });

    return { success: true };
  } catch (e) {
    console.error('Quiz Submit Error:', e);
    throw createError({ statusCode: 500, message: e.message });
  }
});
