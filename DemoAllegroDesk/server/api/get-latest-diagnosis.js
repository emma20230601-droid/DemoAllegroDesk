import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event);
    const query = getQuery(event);
    const { studentId } = query; // 前端傳入目前登入的 studentId

    if (!studentId) throw new Error('Missing studentId');

    // 1. Auth 初始化 (沿用妳的 credentials.json 寫法)
    const configPath = path.resolve(process.cwd(), 'credentials.json');
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
      // 🚩 修正：處理 Vercel 的私鑰換行問題
      key: credentials.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 2. 透過 Registry 找到學生專屬 Sheet ID
    const registryId = config.registrySheetId;
    const doc = new GoogleSpreadsheet(registryId, auth);
    await doc.loadInfo();

    const registrySheet = doc.sheetsByTitle['User_Registry'];
    const rows = await registrySheet.getRows();

    const found = rows.find(r => {
      const sId = (r.get('student_id') || '').toString().trim().toLowerCase();
      const loginCode = (r.get('login_code') || '').toString().trim().toLowerCase();
      const target = studentId.toString().trim().toLowerCase();
      return sId === target || loginCode === target;
    });

    if (!found) return { success: false, error: '找不到該學生' };

    const studentName = found.get('sheet_name'); 
    const personalSheetId = found.get('sheet_id');
    const targetSheetName = `${studentName}_Clinic`;

    // 3. 連接到學生的專屬診斷表
    const personalDoc = new GoogleSpreadsheet(personalSheetId, auth);
    await personalDoc.loadInfo();
    
    const clinicSheet = personalDoc.sheetsByTitle[targetSheetName];
    if (!clinicSheet) return { success: false, error: `找不到診斷分頁: ${targetSheetName}` };

    const clinicRows = await clinicSheet.getRows();

    // 🚩 4. 關鍵邏輯：尋找最新一筆「未精通」的紀錄
    // 我們從最後面往回找 (reverse)，找到第一筆 is_mastered 不是 TRUE 的資料
    const latestPending = [...clinicRows].reverse().find(r => {
      const mastered = (r.get('is_mastered') || '').toString().trim().toUpperCase();
      return mastered !== 'TRUE';
    });

    if (latestPending) {
      return {
        success: true,
        data: {
          subject: latestPending.get('subject'),
          title: latestPending.get('title'),
          summary: latestPending.get('summary'),
          tags: latestPending.get('tags'),
          quizzes: latestPending.get('quizzes'), // 這是 JSON 字串
          actions: latestPending.get('actions'),
          is_mastered: latestPending.get('is_mastered')
        }
      };
    }

    return { success: false, message: '目前沒有待完成的思維任務' };

  } catch (error) {
    console.error('[Get Latest Diagnosis Error]', error.message);
    return { success: false, error: error.message };
  }
});
