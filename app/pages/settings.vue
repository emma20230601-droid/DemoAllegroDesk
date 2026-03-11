<template>
  <div class="max-w-3xl mx-auto py-16 px-8 space-y-12">
  <Transition name="fade">
      <div v-if="isSaving" class="fixed inset-0 z-[400] flex items-center justify-center bg-white/60 backdrop-blur-md">
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p class="text-xs font-black text-blue-500 uppercase tracking-[0.3em] animate-pulse">正在同步設定資料...</p>
        </div>
      </div>
    </Transition>

    <div class="mb-12 text-center lg:text-left ml-4">
      <h2 class="text-4xl font-black tracking-tight text-gray-800">系統核心設定</h2>
      <p class="text-xs text-blue-400 font-bold mt-3 uppercase tracking-[0.4em]">Environment & API Configuration</p>
    </div>

    <section class="relative">
      <div class="mb-6 text-center lg:text-left ml-4">
        <h3 class="text-sm font-black text-blue-400 uppercase tracking-[0.4em]">Core Configuration</h3>
        <p class="text-gray-400 text-xs mt-1 font-medium">API 金鑰與雲端儲存空間設定</p>
      </div>

      <div class="bg-white rounded-[56px] border border-blue-50 shadow-[0_40px_80px_rgba(0,0,0,0.03)] overflow-hidden">
        <div class="p-10 lg:p-14 space-y-12">
          
          <div class="space-y-4">
            <div class="flex items-center gap-3 ml-2">
              <span class="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-[10px] font-black">01</span>
              <span class="text-xs font-black text-blue-600 uppercase tracking-widest text-[10px]">Intelligence Service</span>
            </div>
            <div class="relative flex items-center">
              <input v-model="config.gemini_key" :type="showGeminiKey ? 'text' : 'password'" placeholder="Gemini API Key" 
                class="w-full bg-[#F8FBFF] border-2 border-transparent p-6 pr-16 rounded-[32px] text-base outline-none focus:bg-white focus:border-blue-100 transition-all placeholder:text-gray-300 shadow-sm" />
              
              <button @click="showGeminiKey = !showGeminiKey" type="button" class="absolute right-6 text-gray-300 hover:text-blue-400 transition-colors">
                <svg v-if="!showGeminiKey" class="w-5 h-5" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M876.8 156.8c0-9.6-3.2-16-9.6-22.4s-12.8-9.6-22.4-9.6-16 3.2-22.4 9.6L736 220.8c-64-32-137.6-51.2-224-60.8-160 16-288 73.6-377.6 176S0 496 0 512s48 73.6 134.4 176c22.4 25.6 44.8 48 73.6 67.2l-86.4 89.6c-6.4 6.4-9.6 12.8-9.6 22.4s3.2 16 9.6 22.4 12.8 9.6 22.4 9.6 16-3.2 22.4-9.6l704-710.4c3.2-6.4 6.4-12.8 6.4-22.4m-646.4 528Q115.2 579.2 76.8 512q43.2-72 153.6-172.8C304 272 400 230.4 512 224c64 3.2 124.8 19.2 176 44.8l-54.4 54.4C598.4 300.8 560 288 512 288c-64 0-115.2 22.4-160 64s-64 96-64 160c0 48 12.8 89.6 35.2 124.8L256 707.2c-9.6-6.4-19.2-16-25.6-22.4m140.8-96Q352 555.2 352 512c0-44.8 16-83.2 48-112s67.2-48 112-48c28.8 0 54.4 6.4 73.6 19.2zM889.599 336c-12.8-16-28.8-28.8-41.6-41.6l-48 48c73.6 67.2 124.8 124.8 150.4 169.6q-43.2 72-153.6 172.8c-73.6 67.2-172.8 108.8-284.8 115.2-51.2-3.2-99.2-12.8-140.8-28.8l-48 48c57.6 22.4 118.4 38.4 188.8 44.8 160-16 288-73.6 377.6-176S1024 528 1024 512s-48.001-73.6-134.401-176"></path>
                  <path fill="currentColor" d="M511.998 672c-12.8 0-25.6-3.2-38.4-6.4l-51.2 51.2c28.8 12.8 57.6 19.2 89.6 19.2 64 0 115.2-22.4 160-64 41.6-41.6 64-96 64-160 0-32-6.4-64-19.2-89.6l-51.2 51.2c3.2 12.8 6.4 25.6 6.4 38.4 0 44.8-16 83.2-48 112s-67.2 48-112 48"></path>
                </svg>
                <svg v-else class="w-5 h-5" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M512 224c160 16 288 73.6 377.6 176s134.4 134.4 134.4 150.4-48 73.6-134.4 176-217.6 160-377.6 176-288-73.6-377.6-176S0 528 0 512s48-73.6 134.4-176S352 176 512 176M512 736c112-6.4 211.2-48 284.8-115.2Q907.2 512 947.2 512q-40-72-150.4-172.8C723.2 272 624 230.4 512 224c-112 6.4-211.2 48-284.8 115.2Q116.8 512 76.8 512q40 72 150.4 172.8C300.8 752 400 793.6 512 800M512 352c89.6 0 160 70.4 160 160s-70.4 160-160 160-160-70.4-160-160 70.4-160 160-160M512 608c54.4 0 96-41.6 96-96s-41.6-96-96-96-96 41.6-96 96 41.6 96 96 96"></path>
                </svg>
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center gap-3 ml-2">
              <span class="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-[10px] font-black">02</span>
              <span class="text-xs font-black text-blue-600 uppercase tracking-widest text-[10px]">Database (Sheet ID)</span>
            </div>
            <input v-model="config.sheet_id" placeholder="Google Sheet ID" 
              class="w-full bg-[#F8FBFF] border-2 border-transparent p-6 rounded-[32px] text-base outline-none focus:bg-white focus:border-blue-100 transition-all placeholder:text-gray-300 shadow-sm" />
          </div>

          <div class="h-px bg-blue-50/50"></div>
          <!--
<div class="space-y-8 mt-16 pt-16 border-t border-slate-50">
  <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 ml-4">
    <div class="space-y-1">
      <h3 class="text-sm font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3">
        <span class="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
        AI Core Logic
      </h3>
      <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">調整各模組的思考邏輯與輸出指令</p>
    </div>

    <div class="flex p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50">
      <button v-for="(label, key) in promptLabels" :key="key" 
        @click="activePromptTab = key"
        :class="[
          'px-5 py-2 rounded-xl text-[10px] font-black transition-all duration-500 tracking-widest',
          activePromptTab === key 
            ? 'bg-white text-blue-600 shadow-[0_4px_12px_rgba(0,0,0,0.05)] ring-1 ring-black/5' 
            : 'text-slate-400 hover:text-slate-600'
        ]"
      >
        {{ label.short }}
      </button>
    </div>
  </div>

  <div class="relative group px-2">
    <div class="flex items-center gap-3 mb-4 ml-4">
      <span class="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">Mode:</span>
      <span class="text-[11px] font-black text-slate-600 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
        {{ promptLabels[activePromptTab]?.full }}
      </span> 
      <span class="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
  注意：只能修改中文或數字，其餘程式結構請勿修改！
</span>
    </div>
    
    <div class="relative">
      <textarea 
        v-model="config[activePromptTab]" 
        :placeholder="'請輸入 ' + promptLabels[activePromptTab]?.full + ' 的核心指令...'" 
        class="w-full bg-[#FBFDFF] border border-slate-100 p-10 rounded-[48px] text-[13px] leading-relaxed text-slate-600 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/30 transition-all placeholder:text-slate-200 shadow-sm min-h-[450px] resize-none font-mono"
      ></textarea>
      
      <div class="absolute bottom-8 right-10 flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity duration-700">
        <span class="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Protocol v1.0</span>
      </div>
    </div>
  </div>
</div>
-->
          <div class="space-y-6">
            <div class="flex items-center gap-3 ml-2">
              <span class="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center text-[10px] font-black">03</span>
              <span class="text-xs font-black text-gray-400 uppercase tracking-widest text-[10px]">Asset Management</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <input v-model="config.cloudinary_name" placeholder="Cloud Name" class="bg-[#F8FBFF] p-6 rounded-[28px] text-base outline-none focus:bg-white focus:border-blue-100 transition-all shadow-sm" />
              <input v-model="config.cloudinary_api_key" placeholder="API Key" class="bg-[#F8FBFF] p-6 rounded-[28px] text-base outline-none focus:bg-white focus:border-blue-100 transition-all shadow-sm" />
              
              <div class="relative flex items-center">
                <input v-model="config.cloudinary_api_secret" :type="showCloudinarySecret ? 'text' : 'password'" placeholder="API Secret" 
                  class="w-full bg-[#F8FBFF] p-6 pr-14 rounded-[28px] text-base outline-none focus:bg-white focus:border-blue-100 transition-all shadow-sm" />
                <button @click="showCloudinarySecret = !showCloudinarySecret" type="button" class="absolute right-5 text-gray-300 hover:text-blue-400 transition-colors">
                  <svg v-if="!showCloudinarySecret" class="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M876.8 156.8c0-9.6-3.2-16-9.6-22.4s-12.8-9.6-22.4-9.6-16 3.2-22.4 9.6L736 220.8c-64-32-137.6-51.2-224-60.8-160 16-288 73.6-377.6 176S0 496 0 512s48 73.6 134.4 176c22.4 25.6 44.8 48 73.6 67.2l-86.4 89.6c-6.4 6.4-9.6 12.8-9.6 22.4s3.2 16 9.6 22.4 12.8 9.6 22.4 9.6 16-3.2 22.4-9.6l704-710.4c3.2-6.4 6.4-12.8 6.4-22.4m-646.4 528Q115.2 579.2 76.8 512q43.2-72 153.6-172.8C304 272 400 230.4 512 224c64 3.2 124.8 19.2 176 44.8l-54.4 54.4C598.4 300.8 560 288 512 288c-64 0-115.2 22.4-160 64s-64 96-64 160c0 48 12.8 89.6 35.2 124.8L256 707.2c-9.6-6.4-19.2-16-25.6-22.4m140.8-96Q352 555.2 352 512c0-44.8 16-83.2 48-112s67.2-48 112-48c28.8 0 54.4 6.4 73.6 19.2zM889.599 336c-12.8-16-28.8-28.8-41.6-41.6l-48 48c73.6 67.2 124.8 124.8 150.4 169.6q-43.2 72-153.6 172.8c-73.6 67.2-172.8 108.8-284.8 115.2-51.2-3.2-99.2-12.8-140.8-28.8l-48 48c57.6 22.4 118.4 38.4 188.8 44.8 160-16 288-73.6 377.6-176S1024 528 1024 512s-48.001-73.6-134.401-176"></path>
                    <path fill="currentColor" d="M511.998 672c-12.8 0-25.6-3.2-38.4-6.4l-51.2 51.2c28.8 12.8 57.6 19.2 89.6 19.2 64 0 115.2-22.4 160-64 41.6-41.6 64-96 64-160 0-32-6.4-64-19.2-89.6l-51.2 51.2c3.2 12.8 6.4 25.6 6.4 38.4 0 44.8-16 83.2-48 112s-67.2 48-112 48"></path>
                  </svg>
                  <svg v-else class="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M512 224c160 16 288 73.6 377.6 176s134.4 134.4 134.4 150.4-48 73.6-134.4 176-217.6 160-377.6 176-288-73.6-377.6-176S0 528 0 512s48-73.6 134.4-176S352 176 512 176M512 736c112-6.4 211.2-48 284.8-115.2Q907.2 512 947.2 512q-40-72-150.4-172.8C723.2 272 624 230.4 512 224c-112 6.4-211.2 48-284.8 115.2Q116.8 512 76.8 512q40 72 150.4 172.8C300.8 752 400 793.6 512 800M512 352c89.6 0 160 70.4 160 160s-70.4 160-160 160-160-70.4-160-160 70.4-160 160-160M512 608c54.4 0 96-41.6 96-96s-41.6-96-96-96-96 41.6-96 96 41.6 96 96 96"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="pt-8 relative flex flex-col items-center">
            <Transition name="toast-slide">
              <div v-if="showToast" class="absolute -top-10 inset-x-0 flex justify-center z-20 pointer-events-none">
                <div class="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] px-6 py-2 rounded-xl tracking-[0.2em] font-black shadow-sm flex items-center gap-2.5 backdrop-blur-sm">
                  <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  更新成功
                </div>
              </div>
            </Transition>

            <button @click="saveSettings" 
              :class="[
                'w-full overflow-hidden rounded-[32px] p-7 text-sm font-black uppercase tracking-[0.5em] transition-all duration-700 flex items-center justify-center gap-4 border',
                isSaved 
                  ? 'bg-emerald-50 text-emerald-500 border-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.05)]' 
                  : 'bg-[#F0F7FF] hover:bg-[#E2EFFF] text-[#4A86D4] border-blue-100 shadow-sm hover:scale-[1.01]'
              ]"
            >
              <span v-if="!isSaved" class="flex items-center gap-4">
                儲存設定並同步載入 <span class="text-xl">→</span>
              </span>
              <span v-else class="flex items-center gap-3 animate-in fade-in zoom-in duration-500">
                <span class="text-xl">🌿</span> 設定已成功更新
              </span>
            </button>
            <p v-if="!isSaved" class="text-[10px] text-gray-300 mt-6 tracking-[0.2em] uppercase font-medium">
              All data is stored locally in your browser
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, inject } from 'vue';

const isSaved = ref(false);
const showToast = ref(false);
const showGeminiKey = ref(false);
const showCloudinarySecret = ref(false);
const userConfig = inject('userConfig'); // 🚩 注入全域設定

const updateGlobalConfig = inject('updateGlobalConfig');

const isSaving = ref(false); // 🚩 新增儲存中狀態

// 1. 定義編輯狀態與標籤
const activePromptTab = ref('prompt_analyze_clinic_post'); 
const promptLabels = {
  prompt_analyze_clinic_post: { short: '診斷', full: 'AI 診療中心診斷', target: '診療中心' },
  prompt_assignments_post: { short: '掃描', full: '學習戰情室考卷掃描分析', target: '戰情室' },
  prompt_sessions_post: { short: '出題', full: '學習日誌 AI 智能出題', target: '日誌' },
  prompt_vision_sessions_post: { short: '視覺', full: '學習日誌筆記影像分析', target: '日誌' }
};

// 2. 初始化 config
const config = reactive({
  student_id: '', 
  gemini_key: '',
  sheet_id: '',
  cloudinary_name: '',
  cloudinary_api_key: '',
  cloudinary_api_secret: '',
  prompt_analyze_clinic_post: '',
  prompt_assignments_post: '',
  prompt_sessions_post: '',
  prompt_vision_sessions_post: ''
});

// 3. 載入邏輯：參考妳提供的 query 傳參方式


onMounted(async () => {
  // 1. 先從 allegro_config 讀取基礎設定 (API Keys 等)
  const savedConfig = localStorage.getItem('allegro_config');
  if (savedConfig) {
    try {
      Object.assign(config, JSON.parse(savedConfig));
    } catch (e) {
      console.error('解析 allegro_config 失敗', e);
    }
  }

  // 2. 🚩 關鍵：從 allegro_auth_session 抓取 student_id
  const authSession = localStorage.getItem('allegro_auth_session');
  if (authSession) {
    try {
      const authData = JSON.parse(authSession);
      // 假設結構是 { student_id: '...' } 或 { login_code: '...' }
      config.student_id = authData.student_id || authData.login_code || '';
      console.log('📍 從 Auth Session 取得 Student ID:', config.student_id);
    } catch (e) {
      console.error('解析 allegro_auth_session 失敗', e);
    }
  }

  // 3. 如果還是沒有 ID，嘗試從 inject 的全域變數拿
  if (!config.student_id && userConfig?.student_id) {
    config.student_id = userConfig.student_id;
  }

  // 4. 執行雲端抓取 (確保有 ID 才發送)
  if (config.student_id) {
    console.log('🚀 開始同步雲端指令集...');
    try {
      const res = await $fetch('/api/config-sync', {
        method: 'GET',
        query: { studentId: config.student_id }
      });
      
      console.log('📡 API 回傳結果:', res);

      if (res.success && res.data) {
        // 更新 Prompt 指令
        Object.keys(promptLabels).forEach(key => {
          if (res.data[key]) config[key] = res.data[key];
        });
        console.log('✅ 指令集載入成功');
      }
    } catch (err) {
      console.error('🔥 API 請求異常:', err);
    }
  } else {
    console.warn('⚠️ 找不到 Student ID，請檢查登入狀態');
  }
});

// 4. 儲存邏輯：同樣使用 query 物件
const saveSettings = async () => {

  if (isSaving.value) return; // 防止重複觸發
  
  isSaving.value = true; // 🚀 開始轉圈
  isSaved.value = false;

  if (config.sheet_id) {
    config.sheet_name = config.sheet_id; 
  }

  // 存到本地
  localStorage.setItem('allegro_config', JSON.stringify(config));

  // 🚩 同步到 Google Sheet
  try {
    const res = await $fetch('/api/config-sync', {
      method: 'POST',
      query: { studentId: config.student_id }, // 👈 指定是哪個學生的 Sheet
      body: {
        configData: {
          prompt_analyze_clinic_post: config.prompt_analyze_clinic_post,
          prompt_assignments_post: config.prompt_assignments_post,
          prompt_sessions_post: config.prompt_sessions_post,
          prompt_vision_sessions_post: config.prompt_vision_sessions_post
        }
      }
    });

    // 模擬一個小延遲讓轉圈有感（且確保資料寫入穩定）
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (res.success) {
      console.log('✅ 雲端指令儲存成功');
    }
  } catch (err) {
    console.error('❌ 雲端同步失敗:', err.message);
  }finally {
    // 🏁 結束轉圈
    isSaving.value = false;
    
    // UI 反饋
    if (updateGlobalConfig) updateGlobalConfig();
    isSaved.value = true;
    showToast.value = true;
    
    setTimeout(() => { 
      isSaved.value = false; 
      showToast.value = false; 
    }, 3500);
  }
};
</script>


<style scoped>
.toast-slide-enter-active, .toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.toast-slide-enter-from, .toast-slide-leave-to {
  transform: translateY(-15px);
  opacity: 0;
}
</style>
