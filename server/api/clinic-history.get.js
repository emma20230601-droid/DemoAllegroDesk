import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  try {
    // 1. 從前端發送的 params 中取得參數
    const query = getQuery(event);
    const { studentId, subject, title, sheetId: querySheetId } = query;

    if (!studentId) {
      return { success: false, error: '缺少 Student ID' };
    }

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
          message: '找不到 Google 憑證設定 (環境變數或 credentials.json)' 
        });
      }
    }

    // 🚩 核心修正：處理私鑰換行問題，確保 JWT 認證在任何環境都能解析
    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    // --- 🛡️ 門禁處理結束 ---

   // 🚩 3. 核心邏輯：決定 Registry 位置 (優先使用前端傳來的 sheetId)
    const registryTargetId = querySheetId || config.registrySheetId || config.googleSheetId;
    if (!registryTargetId) throw new Error('未提供 Sheet ID 且系統無預設 Registry');

    const doc = new GoogleSpreadsheet(registryTargetId, auth);
    await doc.loadInfo();

    const registrySheet = doc.sheetsByTitle['User_Registry'];
    if (!registrySheet) throw new Error(`在表 ${registryTargetId} 中找不到 User_Registry`);

    const rows = await registrySheet.getRows();

    // 尋找學生註冊資訊
    const found = rows.find(r => {
      const sId = String(r.get('student_id') || '').trim().toLowerCase();
      const target = String(studentId).trim().toLowerCase();
      return sId === target;
    });

    if (!found) return { success: false, error: `找不到學生 ${studentId} 的註冊資料` };

    // 4. 取得個人資訊與專屬分頁名稱
    const studentName = found.get('sheet_name') || found.get('student_name') || 'Student';
    const personalSheetId = (found.get('sheet_id') || '').trim() || registryTargetId;
    const targetSheetName = `${studentName.trim()}_Clinic`;

    // 5. 連向個人表並抓取診斷紀錄
    const personalDoc = new GoogleSpreadsheet(personalSheetId, auth);
    await personalDoc.loadInfo();
    
    const clinicSheet = personalDoc.sheetsByTitle[targetSheetName]; 
    if (!clinicSheet) {
      return { success: false, error: `找不到專屬診斷分頁: ${targetSheetName}` };
    }

    const clinicRows = await clinicSheet.getRows();
    let targetEntry;

   // 🚩 保持原本功能邏輯：模式 A 精確搜尋 / 模式 B 找最新未精通
    if (subject && title) {
      targetEntry = [...clinicRows].reverse().find(r => 
        String(r.get('subject') || '').trim() === String(subject).trim() && 
        String(r.get('title') || '').trim() === String(title).trim()
      );
    } else {
      targetEntry = [...clinicRows].reverse().find(r => 
        String(r.get('is_mastered') || '').trim().toUpperCase() !== 'TRUE'
      );
    }

    if (targetEntry) {
      return {
        success: true,
        data: {
          date: targetEntry.get('date'),
          subject: targetEntry.get('subject'),
          title: targetEntry.get('title'),
          summary: targetEntry.get('summary'),
          tags: targetEntry.get('tags'),
          actions: targetEntry.get('actions'),
          wrongIds: targetEntry.get('wrongIds'),
          quizzes: targetEntry.get('quizzes'), 
          is_mastered: targetEntry.get('is_mastered'),
          quiz_results: targetEntry.get('quiz_results'),
          diagnosis_json: targetEntry.get('diagnosis_json')
        }
      };
    }

    return { success: false, message: '查無紀錄' };

  } catch (error) {
    console.error('[Clinic History API Error]:', error.message);
    return { success: false, error: error.message };
  }
});
