# AllegroDesk 快板書桌

> 歡迎使用 **Allegro Desk 快板書桌**！這是一份專為**一般使用者**設計的「本機快速啟動指南」，即使完全不會寫程式，只要跟著以下步驟，也能輕鬆在自己的電腦上跑起來。

---

## 🚀 5 步驟快速架設指南

### 1️⃣ 安裝必要工具
在開始之前，請確保您的電腦已安裝執行環境：

* 🟢 **Node.js**（軟體執行的底層引擎）：👉 [點此前往官網下載](https://nodejs.org/)
  > 💡 **下載建議**：請選擇標有 **LTS (長期支援版)** 的按鈕下載，下載後一路點擊「下一步」完成安裝即可。

---

### 2️⃣ 下載程式碼
1. 點擊本 GitHub 頁面上方的綠色按鈕 **`<> Code`**。
2. 選擇 **`Download ZIP`** 下載專案壓縮檔。
3. 下載後將檔案**解壓縮**到您方便找得到的資料夾（例如：桌面）。

---

### 3️⃣ 開啟命令視窗與安裝零件
1. 開啟剛解壓縮出來的專案資料夾。
2. 開啟命令視窗：
   * 🪟 **Windows 用戶**：點擊資料夾上方的位置列（網址列），直接輸入 `cmd` 後按下 `Enter`。
   * 🍎 **Mac 用戶**：在專案資料夾上點擊右鍵，選擇 **「在終端機服務開啟」**。
3. 在跳出的命令視窗中，輸入以下指令並按下 `Enter`（讓電腦自動下載軟體所需的零件）：

   ```bash
   npm install
   ```

   > ⏳ **小提醒**：第一次安裝需要 1~3 分鐘，看到文字停止跳動且沒有出現紅色 `Error` 就代表成功囉！

---

### 4️⃣ 設定您的專屬金鑰 (`.env`)
這是系統最關鍵的設定，讓程式知道要連接到哪一個 AI 與 Google 試算表：

1. **修改檔名**：在專案資料夾中找到名為 `.env.example` 的檔案，將它**重新命名**為 `.env` *(注意：前面的句點 `.` 不能去掉喔！)*。
2. **填入金鑰**：用電腦內建的記事本或文字編輯器開啟 `.env` 檔案，將您的資料填入對應欄位：

   ```env
   # Google Sheets
   NUXT_PUBLIC_REGISTRY_SHEET_ID="填入您的 Google 試算表 ID"
   NUXT_REGISTRYSHEETID="填入您的 Google 試算表 ID"
   NUXT_GOOGLE_SHEET_ID="填入您的 Google 試算表 ID"
  
   # Google Gemini AI
   NUXT_GEMINI_API_KEY="填入您的 Gemini API Key"
   NUXT_GEMINI_MODEL=gemini-2.0-flash
  
   # Cloudinary
   NUXT_CLOUDINARY_NAME="填入您的空間名稱"
   NUXT_CLOUDINARY_API_KEY="填入您的的眼睛金鑰"
   NUXT_CLOUDINARY_API_SECRET="填入您的秘密金鑰"
   ```
---

### 5️⃣ 啟動系統，正式營業！ 🚀
萬事俱備！請回到剛才的命令視窗，輸入最後一道指令並按下 `Enter`：

```bash
npm run dev
```

當看到畫面上出現亮綠色的 **`http://localhost:3000`** 時：
* 請直接打開瀏覽器（Chrome / Edge / Safari），在網址列輸入 **`localhost:3000`** 並前往。

恭喜您！屬於您家的「快板書桌」已經成功在本機跑起來了！✨

---

> 💡 **日常使用說明**  
> 以後每次要開啟系統時，只需要：**開啟專案資料夾** ➔ **開啟 CMD / 終端機** ➔ **輸入 `npm run dev`** 即可。

---
