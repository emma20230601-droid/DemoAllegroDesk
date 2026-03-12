import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  // 解構前端傳來的註冊資訊
  const { student_id, student_name, sheet_id, login_code } = body;
  const config = useRuntimeConfig(event);

  // 基本防呆檢查
  if (!sheet_id || !student_id || !login_code) {
    throw createError({ statusCode: 400, message: '遺失必要的註冊資訊 (ID, Sheet ID 或 Login Code)' });
  }

  try {
    // --- 1. Google Auth 初始化 (雲端環境變數優先) ---
    let credentials = {};
    if (config.googleCredentials) {
      // 🚩 優先從雲端 (如 Vercel) 環境變數讀取
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
      // 🚩 處理私鑰換行符號，確保雲端佈署不報錯
      key: credentials.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 連接使用者指定的新試算表
    const doc = new GoogleSpreadsheet(sheet_id, auth);
    await doc.loadInfo();

    // --- 2. 定義所有必備的分頁與欄位 ---
    const requiredTabs = [
      { title: 'User_Registry', headers: ['student_id', 'student_name', 'sheet_name', 'role', 'login_code', 'sheet_id'] },
      { title: student_id, headers: ['id', 'date', 'scan_date', 'category', 'title', 'question_key', 'correct_answer', 'user_answer', 'knowledge_point', 'image_url', 'is_mastered', 'ai_explanation'] },
      { title: `${student_id}_Clinic`, headers: ['date', 'subject', 'title', 'summary', 'tags', 'actions', 'wrongIds', 'quizzes', 'is_mastered', 'quiz_results'] },
      { title: 'Sessions', headers: ['sessionId', 'Date', 'Topic', 'Category', 'Points', 'QuizTitle', 'QuizMode', 'QuizJSON', 'student_id'] },
      { title: 'QuizResults', headers: ['sessionId', 'Timestamp', 'studentId', 'StudentName', 'Topic', 'Score', 'IsCorrect'] }
    ];

    // --- 3. 執行建立分頁動作 ---
    for (const tab of requiredTabs) {
      let sheet = doc.sheetsByTitle[tab.title];
      if (!sheet) {
        // 如果分頁不存在才建立，並設定第一列標題
        await doc.addSheet({ title: tab.title, headerValues: tab.headers });
      }
    }

    // --- 4. 寫入註冊資料到該試算表的 User_Registry ---
    const registrySheet = doc.sheetsByTitle['User_Registry'];
    await registrySheet.addRow({
      student_id: 's001', // ✨ 修正：使用動態傳入的 id，而不是固定 's001'
      student_name: student_name || student_id,
      sheet_name: student_name,
      role: 'student',
      login_code: login_code, // 存入密鑰，供 auth.post.js 比對
      sheet_id: sheet_id
    });

    return { 
      success: true, 
      message: `使用者 ${student_id} 的資料表已成功初始化！` 
    };

  } catch (e) {
    console.error('Setup Error:', e);
    throw createError({ 
      statusCode: 500, 
      message: '初始化失敗：' + (e.message || '請確認試算表已共用給服務帳號') 
    });
  }
});
