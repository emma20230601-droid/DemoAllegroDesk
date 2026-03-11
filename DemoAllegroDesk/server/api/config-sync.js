import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

export default defineEventHandler(async (event) => {
  console.log('--- [Config Sync API] 開始執行 ---');
  try {
    const config = useRuntimeConfig(event);
    const method = event.method;
    const { studentId } = getQuery(event);
    
    console.log(`[請求資訊] 方法: ${method}, 學生ID: ${studentId}`);

    if (!studentId) {
      console.error('[API 錯誤] 缺少 Student ID');
      return { success: false, error: '缺少 Student ID' };
    }

    // 🚩 檢查：registrySheetId 是否有抓到
    if (!config.registrySheetId) {
       console.error('[API 錯誤] registrySheetId 未在 runtimeConfig 中定義');
       return { success: false, error: '伺服器配置錯誤' };
    }

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

    // --- 1. 查找 Registry 取得個人 Sheet ID ---
    const registryDoc = new GoogleSpreadsheet(config.registrySheetId, auth);
    await registryDoc.loadInfo();
    const registryRows = await registryDoc.sheetsByTitle['User_Registry'].getRows();
    
    const studentInfo = registryRows.find(r => 
      (r.get('student_id') || '').toString().trim() === studentId.toString().trim() ||
      (r.get('login_code') || '').toString().trim() === studentId.toString().trim()
    );

    if (!studentInfo) {
      console.error(`[API 錯誤] Registry 找不到該學生: ${studentId}`);
      return { success: false, error: '找不到學生登記資料' };
    }

    const personalSheetId = studentInfo.get('sheet_id');
    console.log(`[目標 Sheet ID]: ${personalSheetId}`);

    // --- 2. 進入個人 Sheet 操作 System_Config ---
    const personalDoc = new GoogleSpreadsheet(personalSheetId, auth);
    await personalDoc.loadInfo();
    
    let configSheet = personalDoc.sheetsByTitle['System_Config'];
    if (!configSheet) {
      console.log('[通知] 找不到 System_Config 分頁，正在建立...');
      configSheet = await personalDoc.addSheet({ 
        title: 'System_Config', 
        headerValues: ['Key', 'Value'] 
      });
    }

    // --- 3. 處理 GET (讀取指令集) ---
    if (method === 'GET') {
      const rows = await configSheet.getRows();
      const configMap = {};
      rows.forEach(r => {
        const k = r.get('Key');
        const v = r.get('Value');
        if (k) configMap[k] = v;
      });
      console.log(`[成功] 已讀取指令集: ${Object.keys(configMap).join(', ')}`);
      return { success: true, data: configMap };
    }

    // --- 4. 處理 POST (儲存指令集) ---
    if (method === 'POST') {
      const body = await readBody(event);
      const configData = body.configData;
      
      if (!configData) {
        return { success: false, error: '缺少 configData 內容' };
      }

      console.log(`[同步] 正在更新指令: ${Object.keys(configData).join(', ')}`);
      const rows = await configSheet.getRows();

      for (const [key, value] of Object.entries(configData)) {
        const row = rows.find(r => r.get('Key') === key);
        if (row) {
          // 更新現有 Key
          row.set('Value', value);
          await row.save();
        } else {
          // 新增 Key
          await configSheet.addRow({ Key: key, Value: value });
        }
      }
      console.log('[成功] 指令同步更新完成');
      return { success: true };
    }

  } catch (e) {
    console.error('[Config Sync API 崩潰]:', e);
    return { success: false, error: e.message };
  }
});
