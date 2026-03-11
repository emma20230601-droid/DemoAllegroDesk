// app/composables/useAuth.js
export const useAuth = () => {
  // 🚩 增加 silent 參數，預設為 false (即原本的行為：會彈窗)
  const getValidConfig = (silent = false) => {
    if (process.client) {
      // 1. 取得兩組不同的資料源
      const config = JSON.parse(localStorage.getItem('allegro_config') || '{}');
      const session = JSON.parse(localStorage.getItem('allegro_auth_session') || '{}');
      
      // 2. 定義必填金鑰檢查清單
      const checks = [
        { key: 'gemini_key', label: 'Gemini API Key' },
        { key: 'sheet_id', label: 'Google Sheet ID' },
        { key: 'cloudinary_name', label: 'Cloudinary Name' },
        { key: 'cloudinary_api_key', label: 'Cloudinary API key' },
        { key: 'cloudinary_api_secret', label: 'Cloudinary API Secret' }
      ];

      // 3. 逐一檢查金鑰是否齊全
      for (const item of checks) {
        if (!config[item.key]) {
          // 🚩 只有在非安靜模式下 (silent === false) 才執行彈窗
          if (!silent) {
            if (typeof window !== 'undefined' && typeof window.authGuardAlert === 'function') {
              window.authGuardAlert(
                '設定未完成', 
                `哎呀！你漏填了 【${item.label}】，請先到設置頁面完成設定才能使用 AI 功能喔！`, 
                'warning'
              );
            } else {
              alert(`請確認 ${item.label} 已填寫`);
            }
          }
          return null; 
        }
      }

      // 4. 全部檢查通過，合併回傳
      return {
        ...config,
        ...session,
        student_id: session.student_id || session.id || 'guest',
        student_name: session.userName || session.name || '同學' 
      };
    }
    return null;
  };

  return {
    getValidConfig
  };
};
