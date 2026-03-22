# DemoAllegroDesk

## 💻 本機開發環境設定 (Local Setup)

如果您想在自己的電腦上執行 **Allegro Desk**，請按照以下步驟操作：

### 1️⃣ 安裝必要工具
在開始之前，請確保您的電腦已安裝：
* **Node.js** (建議版本 18.x 以上) -> [下載連結](https://nodejs.org/)
* **Visual Studio Code** (推薦的程式碼編輯器) -> [下載連結](https://code.visualstudio.com/)

### 2️⃣ 下載程式碼
1. 點擊本頁面上方的綠色按鈕 **[<> Code]**。
2. 選擇 **[Download ZIP]** 並解壓縮，或使用 Git 指令：
   ```bash
   git clone [https://github.com/您的帳號/allegro-desk.git](https://github.com/您的帳號/allegro-desk.git)

3️⃣ 安裝零件 (Dependencies)
這一步是讓電腦把執行程式所需的「小零件」全部找齊。
請在 VS Code 下方的 終端機 (Terminal) 視窗中，輸入以下指令並按 Enter：

    ```Bash
    npm install
  
  ⏳ 小提醒： 第一次安裝需要一點時間（約 1-3 分鐘），看到畫面停止跳動且沒有出現紅色 Error 就代表成功囉！

4️⃣ 設定您的專屬金鑰 (.env)
這是最關鍵的「大腦設定」，讓程式知道要連到哪一個 AI 和哪一個試算表：
在左側檔案選單中找到 .env.example。
按右鍵選擇 Rename (重新命名)，將檔名改為 .env（前面的點不能掉喔！）。
打開 .env 檔案，將您的金鑰填入後方的引號內：

NUXT_GEMINI_API_KEY: 填入您的 Gemini API Key。

NUXT_GOOGLE_SHEET_ID: 填入您的 Google 試算表 ID。

NUXT_CLOUDINARY_...: 填入您的圖床金鑰（若需上傳考卷照片）。

💡 如何找到 Google Sheet ID？
打開您的試算表，網址中 https://docs.google.com/spreadsheets/d/ 之後到下一個斜線 / 之前的那串長代碼就是 ID！

5️⃣ 啟動系統，正式營業！ 🚀
萬事俱備，請在終端機輸入最後一道指令：

    ```Bash
    npm run dev
    
當看到畫面上出現亮綠色的 http://localhost:3000 時：
按住鍵盤 Ctrl (或 Mac 的 Command) 並點擊該網址。
或是直接在瀏覽器輸入 localhost:3000。

恭喜您！屬於您家的「快板書桌」已經成功在本機跑起來了！✨


📖 系統使用指南 (Usage Guide)
成功啟動後，關於如何進行「第一次登入」、「填入 API 金鑰」以及「掃描考卷」的詳細圖文教學，請參考我的專欄文章：

👉 【快板書桌實戰指南 04】終章：一鍵啟動！讓 AI 走進孩子的書桌[文章連結](https://vocus.cc/article/69b0af0ffd8978000111e8a3)

在這篇文章中，您將學會：

🛠️ 帳號設定：第一次進入系統的防呆流程。

🧠 補全影像引擎：如何正確填入 Gemini 與 Cloudinary。

📸 實測開工：從拍照到 AI 自動生成筆記的完整示範。
