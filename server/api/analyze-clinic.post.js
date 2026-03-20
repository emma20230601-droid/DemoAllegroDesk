import { readBody, createError } from 'h3';
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from 'path'; 
import fs from 'fs';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  try {
    const body = await readBody(event);
    
    const { student_id, studentName, subject, errors, userConfig } = body; 

    // --- 核心門禁 ---
    let credentials = {};
    if (config.googleCredentials) {
      credentials = typeof config.googleCredentials === 'string' 
        ? JSON.parse(config.googleCredentials) 
        : config.googleCredentials;
    } else {
      const configPath = path.resolve(process.cwd(), 'credentials.json');
      if (fs.existsSync(configPath)) {
        credentials = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    }
    const privateKey = credentials?.private_key ? credentials.private_key.replace(/\\n/g, '\n') : null;

    // 優先順序 —— 前端傳來的 Key > 環境變數中的 Key
    const GEMINI_KEY = userConfig?.gemini_key || config.geminiApiKey;
  
    const GEMINI_MODEL = config.geminiModel || "gemini-2.5-flash"; 

    if (!GEMINI_KEY) {
      throw createError({ 
        statusCode: 500, 
        message: '遺失 API KEY，請確認設定頁面已填寫 Gemini Key' 
      });
    }

    // 1. 初始化 Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      generationConfig: { responseMimeType: "application/json" }
    });
    // 2. 核心 Prompt 指令
    let finalPrompt = "";
    if (body.mode === 'greeting') {
      // --- 模式 A：首頁自動診斷 (輕量化) ---
      finalPrompt = `
        你是一位溫暖且專業的鋼琴與學科導師。
        現在學生【${studentName}】剛打開他的「快板書桌」，系統偵測到他有 ${errors.length} 個未完成的修復任務。
        
        【最近的錯誤重點】: ${JSON.stringify(errors.slice(0, 3))} // 只給最近 3 個，加速解析
        
        【任務】: 
          請寫一段 40 字內的繁體中文留言。
          1. 語氣：調侃但溫暖，像在旁邊拍肩（例：我看你最近跟『${JSON.stringify(errors.slice(0, 3))}』不太熟喔？）。
          2. 限制：必須直接提到「${JSON.stringify(errors.slice(0, 3))}」。
          3. 禁令：絕對禁止提到「第一單元」、「這些題目」或「龍蝦/大軍」。
          4. 格式：{"greeting": "..."}
      `;
    } else {

    finalPrompt = `
    ### CRITICAL LANGUAGE RULE ###
    1. If the subject is "英文" or "English":
       - The "question" and "options" MUST be written in 100% English. 
       - "explanation" and "hint" SHOULD be in Traditional Chinese but must include English S+V+O analysis.
       - Strictly forbid English-Chinese mixing in the "question" and "options" fields.
    2. For other subjects, use Traditional Chinese.

    ### 🚩 ROLE-PLAY & ADDRESSING RULE (稱謂與語氣規範) ###
    1. 稱謂一致性：
       - 嚴禁稱呼學生為「學生」、「同學」或「s001」等代號。
       - 必須全程使用第二人稱「你」來直接對話（例如：你在做這題時...、你原本是不是覺得...）。
       - 只有在「總結 (summary)」或是「任務標題 (simple)」需要展現專業親和力時，才可以使用學生的名字【${studentName}】（例如：${studentName}，這是為你量身打造的...）。
    2. 語氣設定：
       - 想像你是一位「坐在學生身邊，陪他一起看題目的資深導師」。
       - 語氣要像對話，而不是在寫報告。

    你是一位極具洞察力精通各科的教育專家，你不只是回答問題，更擅長拆解學生的「思考誤區」。
    現在要為學生【${studentName}】的【${subject}】錯題進行「思維深度重構」。
    
    【輸入數據 (Error Logs)】:
    ${JSON.stringify(errors)}

    【任務描述】:
    // 🚩 修改 1：增加任務數量，讓 AI 有更多延伸的支點
    產出 5 個「思維修復任務」(actions)。每個任務必須直擊「為什麼會錯」的核心，而不只是重複正確答案。

    【輸出要求 JSON 結構】:
    {
        "tags": ["..."],
        "summary": "...",
        "actions": [
        {
            "simple": "...",
            "detail": "...",
            "how_to": { "type": "...", "data": [...] },
            "goal": "..."
        }
        ],
        "quizzes": [
            {
            "question": "題目敘述 (需包含一個學生容易掉進去的直覺陷阱)",
            "options": ["A. 選項內容", "B. 選項內容", "C. 選項內容", "D. 選項內容"],
            "answer": "英文字母 (如 A)",
            "hint": "啟發式提問 (當學生猶豫時使用)",
            "explanation": "深度詳解 (當學生答錯時顯示。需包含：1.為什麼陷阱選項很誘人？ 2.核心邏輯漏洞在哪？ 3.正確的思考轉折點是什麼？)"
            }
        ]
    }
    
    【⚠️ 深度優化指令 - 務必遵守】：
    1. detail 不要說教：請用「你原本是不是覺得...但其實...」的口吻，先同理學生的直覺錯誤，再點出邏輯斷點。
    2. how_to 的內容要「更硬實」：
        - 若為 table：不要只列標題，要在儲存格內寫出「容易被騙的陷阱點」。
        - 若為 list：要像「心法秘笈」，例如：『第一步：看到XX詞，先在腦中畫個叉』。
    3. 針對具體錯題進行反思：
        - 例如：針對「嘉南大圳」，不要只說它是人工的，要解釋『它是如何把原本不能種地的荒地變成糧倉的因果邏輯』。
        - 例如：針對「里長」，要強調『他沒有公權力開罰單，他只有「服務權」』，這才是考點。
    4. 拒絕廢話：不要說「這能提升競爭力」這種空話，goal 必須寫出「下次看到這類陷阱題時，你會擁有的防禦力」。
    【⚠️ 標題與內容深度進化指令】：
  
  5. 標題 (simple) 禁令：
     - 嚴禁使用：重構、矩陣、連結、邏輯、節點、對抗、補丁。
     - 必須包含：一個具體的「生活場景」或「題目陷阱」。
     - 字數拉長：原本 10 點，現在要求 15-25 字，要像「文章標題」那樣吸引人。
     - 範例：『別再把風景當成鄉村唯一的特徵！試著找出那些隱藏在田野間的生產秘密。』

  6. 指導語 (detail) 升級：
     - 字數要求：原本 50 字，現在要求 100-150 字。
     - 結構要求：必須包含「同理錯誤」+「反思提問」+「解法提示」。
     - 範例：『你在做這題時，是不是覺得只要有漂亮的風景就是鄉村？但考試很賊，它會用「醫療資源」或「工作類型」來考你。我們要練習的不是背誦，而是想像：如果你住在這，你生病了要去哪？你去哪裡上班？當你能想像生活，你就不會選錯了。』

  7. 實作工具 (how_to) 的具體度：
     - 如果是表格，必須直接把「題目常出的關鍵字」填進去。
     - 不要給空架構，要給「充滿內容」的錦囊妙計。

  8.表格邏輯嚴格指令：
     - 1. 如果 type 為 "table"，必須嚴格遵守「對稱性」。
     - 2. 標題列 (data[0]) 必須清晰，例如：["比較項目", "都市狀況", "鄉村狀況"]。
     - 3. 內容列 (data[1...]) 必須精確對應：
        - 在「都市」欄位，只能寫都市的特徵或真相。
        - 在「鄉村」欄位，只能寫鄉村的特徵或真相。
     - 4. 禁止在同一個儲存格內混雜兩個區域的描述。
     - 5. 針對「陷阱點」，請在 detail 裡解釋，表格內請保持「純粹的特徵對比」。

  9.出題指令：
    - 1. 請根據上述 5 個行動建議，分別出 5 道「原創」的情境選擇題。
    - 2. 題目要難，要針對學生「愛用直覺判斷」的毛病。
    - 3. 題目情境要具體（例如：生活對話、社交媒體貼文、產業變化因果）。
    - 【⚠️ 英文科語言隔離指令】：
          💡 語言唯一性：若科目為「英文」，則 "quizzes" 陣列內的question, options欄位必須「全英文」輸出，嚴禁出現任何中文字。
          - 1. 語境真實性：題目必須設定在具體場景（如：Booking a hotel, Job interview, Scientific report），而非單純的文法填充。
          - 2. 誘餌設計：選項必須包含「時態干擾項」或「詞性陷阱」，測試學生是否真的理解句子結構。
          - 3. 詳解內容及暗示 (Explanation, hint)：用中文撰寫，且需拆解句型架構（S + V + O），並指明關鍵字（Keywords）如何決定答案。
          💡 4. 難度對標：語法與用字需對標「會考/英檢」中高階程度，避免過於簡單的直觀題。
          💡 再次強調：只要科目是「英文」，"question" 欄位絕對禁止出現中文，這是我最優先的要求。

  10. 測驗格式嚴格規範：
      -1. answer 欄位：請「只」輸出選項英文字母（如 "A"、"B"、"C" 或 "D"），不要包含任何標點符號或文字。
      -2. options 陣列：請確保每個選項前面都有 A. B. C. D. 的標註（例如：["A. 都市", "B. 鄉村"...]）。
      -3. 數量對齊：必須產出「剛好 5 題」，且第一題對應 actions[0]，以此類推。
      -4. hint 指令：提示不要直接說答案，要用啟發式問句，例如：『想一想，如果大家都自己開車，馬路上的車會變多還是變少呢？』

  11. 答題詳解進化指令：
    1. explanation (詳解) 禁止敷衍：
       - 禁止只寫「答案是 A，因為...」。
       - 必須採用「同理陷阱法」：『同學，你選這個選項可能是因為你直覺認為...，但請注意題目中的「隱藏條件」，實際上...』。
       - 字數要求 80-120 字，要讓學生看完後有「原來如此！」的恍然大悟感。
    2. 題目陷阱設計：
       - 選項中必須包含一個「半對半錯」的誘餌，測試學生是否細心。 
  
  12. 標籤 (tags) 數量與質量控制：
   - 數量限制：🚩 嚴禁輸出超過 3 個標籤。
   - 內容規範：
     - 第一個標籤必須是「學科分類」（例如：國中社會、國小自然）。
     - 第二個標籤必須是「核心概念」（例如：人口老化、嘉南大圳）。
     - 第三個標籤必須是「思維弱點」（例如：直覺陷阱、因果誤判）。
   - 嚴禁輸出無意義的標籤（如：思考誤區、閱讀理解、常識辨析）。
    `;
    }
    console.log('--- 🚀 最終送出指令檢查 (純代碼版) ---');
    console.log('指令字數:', finalPrompt.length);

    // 3. 執行生成
    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text(); 
    
    // 4. 解析回傳
    try {
      const cleanText = text.replace(/```json|```/g, '').trim();
      const diagnosis = JSON.parse(cleanText);
      return { success: true, ...diagnosis };
    } catch (e) {
      console.error("Gemini JSON 解析失敗:", text);
      throw createError({ statusCode: 500, message: "AI 回傳格式異常" });
    }

  } catch (error) {
    console.error('[Clinic API Error]', error);
    return { success: false, message: error.message };
  }
});
