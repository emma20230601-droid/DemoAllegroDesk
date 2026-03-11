import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

export default defineEventHandler(async (event) => {
  try {
    // 1. 取得 Body 並解構
    const body = await readBody(event);
    const { code, sheet_id } = body; 
    const config = useRuntimeConfig(event);
    
    // 原本設定：取得配置 ID
    const primaryRegistryId = config.registrySheetId;
    let credentials = {};

    // 2. 保持原本設定：判斷是用環境變數還是實體檔案 (雲端/本地自動切換)
    if (config.googleCredentials) {
      credentials = typeof config.googleCredentials === 'string' 
        ? JSON.parse(config.googleCredentials) 
        : config.googleCredentials;
    } else {
      const configPath = path.resolve(process.cwd(), 'credentials.json');
      if (fs.existsSync(configPath)) {
        credentials = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } else {
        throw createError({ statusCode: 500, statusMessage: '找不到 Google 憑證設定' });
      }
    }

    // 3. 設定 Google Auth (處理私鑰換行問題)
    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // --- 定義核心搜尋函數 ---
    const findUserInSheet = async (targetId) => {
      if (!targetId) return null;
      try {
        const doc = new GoogleSpreadsheet(targetId, auth);
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['User_Registry'];
        if (!sheet) return null;

        const rows = await sheet.getRows();
        const loginCode = String(code).trim().toLowerCase();
        
        return rows.find(r => 
          String(r.get('login_code') || '').toLowerCase() === loginCode || 
          String(r.get('student_id') || '').toLowerCase() === loginCode
        );
      } catch (e) {
        console.warn(`[Auth Warning]: 無法在試算表 ${targetId} 中搜尋使用者:`, e.message);
        return null;
      }
    };

    // --- 執行搜尋邏輯 (核心修改部分) ---
    
    // 步驟 A: 先在原本設定的「環境變數總表」中尋找
    let matchedUser = await findUserInSheet(primaryRegistryId);

    // 步驟 B: 如果總表找不到，且有傳入新的 sheet_id (代表新註冊直登)，則去新表找
    if (!matchedUser && sheet_id && sheet_id !== primaryRegistryId) {
      console.log(`[Auth]: 總表未找到匹配，嘗試搜尋新註冊表: ${sheet_id}`);
      matchedUser = await findUserInSheet(sheet_id);
    }

    // 5. 回傳結果 (保持原本回傳格式)
    if (matchedUser) {
      console.log(`[Auth Success]: 使用者 ${matchedUser.get('student_name')} 登入成功`);
      return {
        success: true,
        user: {
          id: matchedUser.get('student_id'),
          name: matchedUser.get('student_name'),
          sheet_name: matchedUser.get('sheet_name'),
          role: matchedUser.get('role') || 'student', 
          sheet_id: matchedUser.get('sheet_id')
        }
      };
    }

    // 6. 失敗處理
    throw createError({ statusCode: 401, statusMessage: '代碼無效' });

  } catch (error) {
    console.error('[Auth API Exception]:', error.message);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message
    });
  }
});
