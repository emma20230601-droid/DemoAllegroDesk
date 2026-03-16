<template>
  <div class="h-screen w-full bg-[#FDFDFB] text-[#333333] font-sans antialiased flex overflow-hidden">
    
    <div v-if="!isLoggedIn" class="flex-1 flex items-center justify-center bg-[#FDFDFB]">
  <div class="w-full max-w-[380px] p-16 bg-white border border-[#EEEBE5] text-center shadow-[0_4px_30px_-15px_rgba(0,0,0,0.05)]">
    
    <div class="mb-14">
      <h2 class="text-[12px] tracking-[0.8em] font-light text-[#A0A0A0] uppercase mb-2">Allegro Desk</h2>
      <div class="h-[1px] w-6 bg-[#333333] mx-auto opacity-20"></div>
    </div>

    <div v-if="isRegisterMode" class="space-y-10 animate-fade-in">
      <div class="space-y-2">
        <h3 class="text-sm tracking-[0.3em] font-medium text-[#555555]">新使用者註冊</h3>
        <p class="text-[9px] text-[#CCCCCC] tracking-widest uppercase italic">Initialize New Desk</p>
      </div>

      <div class="space-y-6 text-left">
        <div class="border-b border-[#EEEBE5] pb-1">
          <label class="text-[9px] text-[#A0A0A0] uppercase tracking-widest">User ID / 帳號</label>
          <input v-model="regForm.student_id" type="text" placeholder="例如: Anna" class="w-full py-2 outline-none text-sm tracking-widest bg-transparent" />
        </div>
        <div class="border-b border-[#EEEBE5] pb-1">
          <label class="text-[9px] text-[#A0A0A0] uppercase tracking-widest">Login Code / 存取密鑰</label>
          <input v-model="regForm.login_code" type="text" placeholder="設定您的登入碼" class="w-full py-2 outline-none text-sm tracking-widest bg-transparent" />
        </div>
        <div class="border-b border-[#EEEBE5] pb-1">
          <label class="text-[9px] text-[#A0A0A0] uppercase tracking-widest">Google Sheet ID</label>
          <input v-model="regForm.sheet_id" type="text" placeholder="貼上空白試算表 ID" class="w-full py-2 outline-none text-[10px] bg-transparent" />
        </div>
      </div>

      <div class="space-y-4 pt-4">
        <button 
          @click="handleRegister"
          :disabled="isProcessing"
          class="w-full bg-[#333333] text-white py-5 text-[11px] tracking-[0.4em] uppercase hover:bg-black transition-all disabled:bg-gray-200 active:scale-[0.98]"
        >
          {{ isProcessing ? '初始化中...' : '確認註冊 / Register' }}
        </button>
        <button @click="isRegisterMode = false" class="text-[10px] text-[#A0A0A0] hover:text-[#333333] tracking-widest uppercase underline underline-offset-4 decoration-[#EEEBE5]">返回登入</button>
      </div>
    </div>

    <div v-else class="space-y-10 animate-fade-in">
      <div class="space-y-2">
        <h3 class="text-sm tracking-[0.3em] font-medium text-[#555555]">存取密鑰</h3>
        <p class="text-[9px] text-[#CCCCCC] tracking-widest uppercase italic">Access Passcode</p>
      </div>

      <div class="space-y-8">
        <div class="relative">
          <label class="block text-[9px] text-[#A0A0A0] uppercase tracking-widest text-left mb-1 ml-1">Passcode</label>
          <div class="relative flex items-center">
            <input 
              v-model="loginInput" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="••••••"
              class="w-full border-b border-[#EEEBE5] py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-[#333333] transition-all placeholder:text-[#F0F0F0] bg-transparent"
              @keyup.enter="handle"
            />
            <button @click="showPassword = !showPassword" type="button" class="absolute right-0 p-2 text-[#CCCCCC] hover:text-[#777777]" tabindex="-1">
              <svg v-if="!showPassword" class="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M876.8 156.8c0-9.6-3.2-16-9.6-22.4s-12.8-9.6-22.4-9.6-16 3.2-22.4 9.6L736 220.8c-64-32-137.6-51.2-224-60.8-160 16-288 73.6-377.6 176S0 496 0 512s48 73.6 134.4 176c22.4 25.6 44.8 48 73.6 67.2l-86.4 89.6c-6.4 6.4-9.6 12.8-9.6 22.4s3.2 16 9.6 22.4 12.8 9.6 22.4 9.6 16-3.2 22.4-9.6l704-710.4c3.2-6.4 6.4-12.8 6.4-22.4m-646.4 528Q115.2 579.2 76.8 512q43.2-72 153.6-172.8C304 272 400 230.4 512 224c64 3.2 124.8 19.2 176 44.8l-54.4 54.4C598.4 300.8 560 288 512 288c-64 0-115.2 22.4-160 64s-64 96-64 160c0 48 12.8 89.6 35.2 124.8L256 707.2c-9.6-6.4-19.2-16-25.6-22.4m140.8-96Q352 555.2 352 512c0-44.8 16-83.2 48-112s67.2-48 112-48c28.8 0 54.4 6.4 73.6 19.2zM889.599 336c-12.8-16-28.8-28.8-41.6-41.6l-48 48c73.6 67.2 124.8 124.8 150.4 169.6q-43.2 72-153.6 172.8c-73.6 67.2-172.8 108.8-284.8 115.2-51.2-3.2-99.2-12.8-140.8-28.8l-48 48c57.6 22.4 118.4 38.4 188.8 44.8 160-16 288-73.6 377.6-176S1024 528 1024 512s-48.001-73.6-134.401-176"></path></svg>
              <svg v-else class="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 224c160 16 288 73.6 377.6 176s134.4 134.4 134.4 150.4-48 73.6-134.4 176-217.6 160-377.6 176-288-73.6-377.6-176S0 528 0 512s48-73.6 134.4-176S352 176 512 176M512 736c112-6.4 211.2-48 284.8-115.2Q907.2 512 947.2 512q-40-72-150.4-172.8C723.2 272 624 230.4 512 224c-112 6.4-211.2 48-284.8 115.2Q116.8 512 76.8 512q40 72 150.4 172.8C300.8 752 400 793.6 512 800M512 352c89.6 0 160 70.4 160 160s-70.4 160-160 160-160-70.4-160-160 70.4-160 160-160M512 608c54.4 0 96-41.6 96-96s-41.6-96-96-96-96 41.6-96 96 41.6 96 96 96"></path></svg>
            </button>
          </div>
        </div>

        <div class="relative">
          <label class="block text-[9px] text-[#A0A0A0] uppercase tracking-widest text-left mb-1 ml-1">Spreadsheet ID (Optional)</label>
          <input 
            v-model="loginSheetId" 
            placeholder="Leave blank for default"
            class="w-full border-b border-[#EEEBE5] py-3 text-center text-[10px] outline-none focus:border-[#333333] transition-all placeholder:text-[#F0F0F0] bg-transparent tracking-widest"
            @keyup.enter="handleLogin"
          />
        </div>
      </div>

      <div class="space-y-4 pt-4">
        <button 
          @click="handleLogin"
          class="w-full bg-[#333333] text-white py-5 text-[11px] tracking-[0.4em] uppercase hover:bg-black transition-all duration-300 active:scale-[0.98]"
        >
          登入系統 / Sign In
        </button>

      </div>
    </div>

    <p class="mt-14 text-[9px] text-[#DDDDDD] tracking-widest uppercase">Authorized Access Only</p>
  </div>
</div>

    <div v-show="isLoggedIn" class="flex w-full h-full overflow-hidden">
      <nav class="h-full w-20 lg:w-64 bg-white border-r border-[#EEEBE5] flex flex-col items-center py-10 flex-shrink-0">
        <div class="hidden lg:block mb-10 flex-shrink-0">
          <h2 class="text-[10px] tracking-[0.6em] font-light text-[#A0A0A0] uppercase text-center leading-loose">Allegro<br/>Desk</h2>
        </div>
        <div class="lg:hidden mb-8 text-xl font-serif text-[#444444] flex-shrink-0">A.</div>

        <div class="flex flex-col w-full flex-1 overflow-y-auto no-scrollbar">
          <NuxtLink v-for="link in filteredLinks" :key="link.path" :to="link.path" custom>
            <template #default="{ isActive, navigate }">
              <div @click="navigate" :class="['relative flex flex-col lg:flex-row items-center gap-4 px-8 py-6 transition-all duration-300 group cursor-pointer', isActive ? 'bg-[#F9F9F7]' : 'hover:bg-[#FAFAF9]']">
                <div v-if="isActive" class="absolute left-0 top-0 bottom-0 w-[2px] bg-[#333333]"></div>
                <div :class="['text-base transition-all', isActive ? 'opacity-100' : 'opacity-30']">{{ link.icon }}</div>
                <span :class="['hidden lg:block text-[13px] tracking-[0.15em] font-medium transition-colors duration-500', isActive ? 'text-[#111111]' : 'text-[#777777] group-hover:text-[#222222]']">{{ getLinkLabel(link) }}</span>
              </div>
            </template>
          </NuxtLink>
        </div>
        
        <div class="w-full mt-auto flex-shrink-0 flex flex-col items-center pt-4">
          <div v-if="userName" class="px-8 py-4 w-full border-b border-[#F4F1ED] mb-2 flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-[#F4F1ED] flex items-center justify-center text-[10px] text-[#777777] font-medium flex-shrink-0">{{ userName.charAt(0) }}</div>
            <div class="hidden lg:flex flex-col overflow-hidden">
              <span class="text-[9px] tracking-[0.2em] text-[#CCCCCC] uppercase leading-none mb-1">Current User</span>
              <span class="text-[12px] text-[#333333] font-medium truncate">{{ userName }}</span>
            </div>
          </div>
          <button @click="logout" class="flex flex-col lg:flex-row items-center gap-3 lg:gap-4 px-8 py-4 w-full group transition-all duration-300 hover:bg-red-50/30">
            <div class="text-base opacity-30 group-hover:opacity-100 group-hover:text-red-400">🚪</div>
            <div class="hidden lg:flex flex-col items-start leading-tight">
              <span class="text-[9px] tracking-[0.2em] text-[#CCCCCC] group-hover:text-red-400 uppercase">Logout</span>
              <span class="text-[10px] text-[#777777] group-hover:text-red-600 font-medium">登出系統</span>
            </div>
          </button>
          <div class="pb-4 pt-2 w-full flex justify-center opacity-40">
            <p class="text-[8px] text-[#999999] tracking-[0.2em] text-center uppercase">© 2026 Homestudy Mom · 碼農媽媽</p>
          </div>
        </div>
      </nav>

      <main class="flex-1 h-full overflow-y-auto bg-[#FDFDFB]">
        <div class="max-w-5xl mx-auto p-12 lg:p-20">
          <NuxtPage />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, provide, ref, computed, watch } from 'vue';
import Swal from 'sweetalert2';

// --- 新增的狀態變數 ---
const isRegisterMode = ref(false);
const isProcessing = ref(false);
const regForm = reactive({
  student_id: '',
  login_code: '',
  sheet_id: ''
});

const showPassword = ref(false); 
const toast = reactive({ show: false, msg: '' });
const showToast = (message) => {
  toast.msg = message;
  toast.show = true;
  setTimeout(() => { toast.show = false; }, 3000);
};

provide('showToast', showToast);
const isLoggedIn = ref(false);
const loginInput = ref('');
const loginSheetId = ref(''); // 這是妳綁定的輸入框

const globalConfig = reactive({
  gemini_key: '',
  sheet_id: '',   
  sheet_name: '', 
  role: 'student',
  student_id: '',
  userName: ''
});


const router = useRouter();

/**
 * 核心彈窗函式
 * @param {string} title - 標題
 * @param {string} text - 內容
 * @param {string} icon - 圖示 (success, error, warning, info, question)
 */
const showAlert = (title, text, icon = 'info') => {
  const isAuthGuard = title.includes('設定') || title.includes('存取');

  Swal.fire({
    // 💡 標題：加強字重與字距
    title: `<span style="font-weight: 900; color: #1E293B; letter-spacing: 0.3em; text-transform: uppercase;">${title}</span>`,
    html: `<div style="line-height: 1.8; color: #475569; font-size: 15px; font-weight: 500; padding: 0 15px;">${text}</div>`,
    
    icon: icon,
    iconColor: '#3B82F6', 
    
    confirmButtonText: '前往設置頁面 →',
    showCancelButton: true,
    cancelButtonText: '稍後再說',
    
    buttonsStyling: true, 
    confirmButtonColor: '#2563EB', // 💡 換成紮實的強烈寶藍
    cancelButtonColor: '#F8FAFC', 
    
    customClass: {
      popup: 'allegro-bold-popup',
      actions: 'allegro-bold-actions',
      confirmButton: 'allegro-bold-btn btn-bold-confirm',
      cancelButton: 'allegro-bold-btn btn-bold-cancel'
    },
    
    background: '#FFFFFF',
    backdrop: `rgba(15, 23, 42, 0.15)`, // 稍微加深遮罩，凸顯亮色彈窗
    showClass: { popup: 'animate__animated animate__zoomIn animate__faster' },
    hideClass: { popup: 'animate__animated animate__fadeOut animate__faster' }
  }).then((result) => {
    if (result.isConfirmed) {
      router.push({ path: '/settings', query: { first_time: 'true' } });
    }
  });
};

// 💡 關鍵：掛載到全域門禁變數
if (process.client) {
  window.authGuardAlert = showAlert;
}


// 1. 恢復 Session 與設定
const refreshConfig = () => {
  const sessionData = localStorage.getItem('allegro_auth_session');
  const configData = localStorage.getItem('allegro_config'); // 🚩 也要讀取 configData

  // 1. 先從 configData 恢復基礎環境變數 (如 gemini_key)
  if (configData) {
    try {
      const savedConfig = JSON.parse(configData);
      Object.assign(globalConfig, savedConfig);
    } catch (e) {
      console.error('解析 Config 失敗');
    }
  }

  // 2. 如果有登入 Session，則以 Session 的身分資訊為最高準則
  if (sessionData) {
    try {
      const auth = JSON.parse(sessionData);
      
      // 更新 globalConfig 的身分部分
      Object.assign(globalConfig, {
        ...auth,
        userName: auth.userName || auth.name
      });

      isLoggedIn.value = true;
      userName.value = globalConfig.userName;

      // 3. ✨ 關鍵修改：同步回 config 時，要用「合併」的
      // 讀取目前的 config，只更新跟身分有關的欄位，保留 gemini_key
      const currentConfig = configData ? JSON.parse(configData) : {};
      const mergedConfig = {
        ...currentConfig, // 保留舊有的 gemini_key 等
        sheet_id: auth.sheet_id,
        student_id: auth.student_id || auth.id,
        role: auth.role
      };
      
      localStorage.setItem('allegro_config', JSON.stringify(mergedConfig));
      console.log('[Config] 系統配置已恢復且合併:', globalConfig.student_id);
    } catch (e) {
      console.error('[Config] 解析 Session 失敗', e);
    }
  } else {
    isLoggedIn.value = false;
  }
};

const handleLoginSuccess = (user) => {
  // 1. 🚩 不要直接刪除！先讀取現有的 config (裡面有妳的 gemini_key)
  const existingConfigRaw = localStorage.getItem('allegro_config');
  let existingConfig = {};
  
  if (existingConfigRaw) {
    try {
      existingConfig = JSON.parse(existingConfigRaw);
    } catch (e) {
      existingConfig = {};
    }
  }

  // 2. 更新 Session (這可以清除舊的 Session 沒關係，因為 Session 只管登入身分)
  localStorage.removeItem('allegro_auth_session');
  localStorage.setItem('allegro_auth_session', JSON.stringify({
    isLoggedIn: true,
    ...user,
    userName: user.name,
    student_id: user.id
  }));

  // 3. 🚩 關鍵：合併 Config 而不是覆蓋
  // 使用 ...existingConfig 保留舊家具，再把新的身分 ID 塞進去
  const newConfig = {
    ...existingConfig,        // 保留 gemini_key 等環境變數
    sheet_id: user.sheet_id,  // 更新為當前登入者的表
    student_id: user.id,      // 更新為當前登入者的 ID
    role: user.role
  };
  
  localStorage.setItem('allegro_config', JSON.stringify(newConfig));

  // 4. 同步更新到 UI 用的變數
  Object.assign(globalConfig, newConfig);
  globalConfig.userName = user.name;
  isLoggedIn.value = true;
  userName.value = user.name;
  
  showToast(`歡迎回來！${user.name}`);
};

// 3. 登入邏輯
const handleLogin = async () => {
  let code = loginInput.value.trim().toLowerCase();
  
  let sheetId = loginSheetId.value.trim();  
console.log("code=",code);
  console.log("sheetId=",sheetId);
  if (!code || !sheetId) return alert('請輸入登入代碼與 Google Sheet ID');

  try {
    showToast('正在連線至雲端資料庫...');

    // 💡 關鍵：直接請求公開的 JSON 資料格式
    // 注意：sheet=User_Registry 必須與你分頁名稱完全一致
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=User_Registry`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('無法讀取試算表，請檢查 ID 是否正確或權限是否開啟');
    
    const text = await res.text();
    // 處理 Google 回傳的 "google.visualization.Query.setResponse(...)" 格式
    const jsonData = JSON.parse(text.substring(47, text.length - 2));
    const rows = jsonData.table.rows;

    // 💡 根據你的欄位順序比對 login_code (索引 4)
    const userRow = rows.find(row => {
      const cellValue = row.c[4]?.v; // 第 5 欄
      return cellValue && cellValue.toString().toLowerCase() === code;
    });

    if (userRow) {
      // 提取資料 (c[0]=id, c[1]=name, c[3]=role)
      const user = {
        id: userRow.c[0]?.v || '',
        name: userRow.c[1]?.v || '',
        role: userRow.c[3]?.v || 'student',
        sheet_id: sheetId
      };
      
      handleLoginSuccess(user);
    } else {
      alert('登入失敗：找不到匹配的登入代碼');
    }
  } catch (e) {
    console.error('Login Error:', e);
    alert('登入發生錯誤：' + (e.message || '請檢查網路或試算表權限'));
  }
};

// 4. ✨ 新增註冊邏輯
const handleRegister = async () => {
  if (!regForm.student_id || !regForm.login_code || !regForm.sheet_id) {
    return alert('請填寫完整註冊資訊');
  }
  isProcessing.value = true;
  try {
    showToast('初始化試算表中...');
    const response = await $fetch('/api/setup', {
      method: 'POST',
      body: {
        student_id: regForm.student_id,
        student_name: regForm.student_id,
        sheet_id: regForm.sheet_id,
        login_code: regForm.login_code
      }
    });

    if (response.success) {
      // 🚩 1. 關閉註冊模式
      isRegisterMode.value = false;
      
      // 🚩 2. 先把註冊好的資料塞進登入用的 ref，供 handleLoginSuccess 使用
      loginInput.value = regForm.login_code; 
      loginSheetId.value = regForm.sheet_id; 
      
      // 🚩 3. 執行登入邏輯 (這會更新 localStorage 並設定 isLoggedIn)
      await handleLogin(); 

      // 🚩 4. 【關鍵跳轉】註冊後直接引導至設定頁面填寫 API Key
      // 我們延遲一小段時間確保 handleLogin 的 toast 先顯示，再跳轉
      setTimeout(() => {
        router.push('/settings');
        // 提醒使用者下一步該做什麼
        setTimeout(() => {
          showToast('註冊成功！請完成 Gemini 與 Cloudinary 設定');
        }, 500);
      }, 800);
    }
  } catch (e) {
    alert(e.data?.message || '初始化失敗');
  } finally {
    isProcessing.value = false;
  }
};

const logout = () => {
  if (confirm('確定要登出嗎？')) {
    localStorage.removeItem('allegro_auth_session'); 
    isLoggedIn.value = false;
    globalConfig.role = 'student';
    globalConfig.student_id = '';
    globalConfig.userName = '';
    globalConfig.sheet_name = '';
    window.location.replace('/'); 
  }
};

const updateGlobalConfig = () => refreshConfig();

onMounted(() => {
  const session = localStorage.getItem('allegro_auth_session');
  if (session) {
    const auth = JSON.parse(session);
    // 只有在 Session 存在時才覆蓋 globalConfig
    Object.assign(globalConfig, auth);
    isLoggedIn.value = true;
    // 統一讀取 userName
    userName.value = auth.userName || auth.name || '';
  }
});

provide('userConfig', globalConfig);
provide('refreshConfig', refreshConfig);
provide('updateGlobalConfig', updateGlobalConfig);

// --- 導覽連結 (保留原本內容) ---
const navLinks = [
  { path: '/', label: '今日修復任務', teacherLabel: '今日修復任務', icon: '🌱' },
  { path: '/media', label: '學習日誌', teacherLabel: '課堂紀錄與評量', icon: '📓' },
  { path: '/class-analytics', label: '全班戰力分析', teacherLabel: '考卷檔案庫', icon: '📊' },              
  { path: '/theory', label: '考卷檔案庫', teacherLabel: '個體診斷', icon: '🔬' },
  { path: '/clinic', label: 'AI 診療中心', teacherLabel: '精準醫療室', icon: '🏥' },
  { path: '/add-assignment', label: '新增練習', teacherLabel: '派發任務', icon: '＋' }, 
  { path: '/settings', label: '系統核心設定', teacherLabel: '管理中心', icon: '⚙️' }          
];

const filteredLinks = computed(() => {
  if (globalConfig.role === 'teacher') return navLinks;
  return navLinks.filter(link => !['/add-assignment', '/class-analytics'].includes(link.path));
});

const getLinkLabel = (link) => {
  return globalConfig.role === 'teacher' ? (link.teacherLabel || link.label) : link.label;
};

// --- 科目配置 (保留原本內容) ---
const subjectConfigs = {
  '國文': {
    cats: ['字音字形', '國學常識', '閱讀測驗', '作文修辭', '文言文'],
    colors: { '字音字形': '#E11D48', '國學常識': '#FB7185', '閱讀測驗': '#BE123C', '作文修辭': '#FDA4AF', '文言文': '#9F1239' }
  },
  '英文': {
    cats: ['單字片語', '文法結構', '克漏字', '閱讀理解', '聽力測驗'],
    colors: { '單字片語': '#2563EB', '文法結構': '#60A5FA', '克漏字': '#1D4ED8', '閱讀理解': '#93C5FD', '聽力測驗': '#1E3A8A' }
  },
  '數學': {
    cats: ['數與式', '幾何圖形', '代數運算', '機率統計', '邏輯推理'],
    colors: { '數與式': '#059669', '幾何圖形': '#34D399', '代數運算': '#047857', '機率統計': '#6EE7B7', '邏輯推理': '#064E3B' }
  },
  '社會': {
    cats: ['地理考點', '歷史事件', '公民常識'],
    colors: { '地理考點': '#D97706', '歷史事件': '#F59E0B', '公民常識': '#B45309' }
  },
  '自然': {
    cats: ['物理現象', '化學反應', '生物科學', '地球科學'],
    colors: { '物理現象': '#7C3AED', '化學反應': '#A78BFA', '生物科學': '#6D28D9', '地球科學': '#4C1D95' }
  },
  '樂理': {
    cats: ['基礎樂理', '西洋音樂史', '中國音樂史', '樂器學'],
    colors: { '基礎樂理': '#0747A6', '西洋音樂史': '#10B981', '中國音樂史': '#F59E0B', '樂器學': '#8B5CF6' }
  }
};
provide('subjectConfigs', subjectConfigs);

const userName = ref('');
watch(isLoggedIn, (newVal) => {
  if (newVal) {
    const session = JSON.parse(localStorage.getItem('allegro_auth_session') || '{}');
    userName.value = session.userName || '';
  }
});
</script>

<style scoped>
/* 原本樣式保持，新增一個淡入動畫 */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
@media (max-height: 720px) {
  nav { padding-top: 1.5rem; }
  .mb-10 { margin-bottom: 1.5rem; }
}

/* 自定義 SweetAlert2 */
/* 1. 彈窗本體：圓潤且邊框分明 */
.allegro-bold-popup {
  border-radius: 32px !important; /* 同步你的按鈕圓角 */
  padding: 3rem 1.5rem !important;
  border: 1px solid #E2E8F0 !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08) !important;
}

/* 2. 按鈕容器：讓按鈕有呼吸感 */
.swal2-actions.allegro-bold-actions {
  display: flex !important;
  gap: 16px !important;
  margin-top: 30px !important;
  width: 100% !important;
  justify-content: center !important;
}

/* 3. 按鈕基礎：完全複製你那個好看按鈕的結構 */
.allegro-bold-btn {
  min-width: 160px !important; /* 確保寬度夠大，字不會擠 */
  height: 56px !important; /* 增加高度，呼應你的 p-7 */
  border-radius: 32px !important; /* 💡 同步你的 rounded-[32px] */
  font-size: 14px !important;
  font-weight: 900 !important; /* 💡 同步你的 font-black */
  text-transform: uppercase !important; /* 💡 同步你的 uppercase */
  letter-spacing: 0.2em !important; /* 💡 同步你的 tracking */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important; /* 💡 同步你的 duration-700 邏輯但快一點 */
  border: 1px solid transparent !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important;
}

/* 4. 【主動作】深寶藍實心鍵：超醒目 */
.btn-bold-confirm {
  background-color: #2563EB !important; /* 💡 強烈寶藍 */
  color: #FFFFFF !important;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.2) !important;
}

.btn-bold-confirm:hover {
  background-color: #1D4ED8 !important;
  transform: scale(1.05) !important; /* 💡 強化你的 hover:scale-[1.01] */
  box-shadow: 0 15px 30px rgba(37, 99, 235, 0.3) !important;
}

/* 5. 【次動作】淺藍框鍵：像你存檔按鈕的「未存檔」狀態，但更淡一點 */
.btn-bold-cancel {
  background-color: #F1F5F9 !important;
  color: #64748B !important;
  border: 1px solid #E2E8F0 !important;
}

.btn-bold-cancel:hover {
  background-color: #E2E8F0 !important;
  color: #475569 !important;
}
</style>
