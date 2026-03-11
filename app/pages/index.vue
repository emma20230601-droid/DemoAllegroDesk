<template>
  <ClientOnly>
    <div class="min-h-screen bg-[#FDFDFE] p-10 text-slate-800 relative">
      
      <transition name="fade">
        <div v-if="isLoading" class="global-loader-overlay">
          <div class="loader-spinner"></div>
          <div class="loader-text font-mono tracking-[0.3em] uppercase text-blue-600/60">
            正在偵測核心弱點...
          </div>
        </div>
      </transition>

      <div class="max-w-5xl mx-auto">
        <header class="mb-16 flex justify-between items-center">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="w-8 h-[1px] bg-slate-300"></span>
              <span class="text-[10px] tracking-[0.4em] text-slate-400 uppercase font-medium">Core Recovery</span>
            </div>
            <h1 class="text-4xl font-extralight tracking-tight text-slate-900">
              今日<span class="font-semibold text-blue-600/80">修復任務</span>
            </h1>
          </div>
          <div class="text-right">
            <div class="text-3xl font-light font-mono text-slate-200">
              {{ filteredBugs.length.toString().padStart(2, '0') }} / {{ allBugs.length.toString().padStart(2, '0') }}
            </div>
            <div class="text-[9px] text-slate-400 uppercase tracking-widest">Protocol Active</div>
          </div>
        </header>

        <div class="grid grid-cols-3 md:grid-cols-7 gap-6 mb-20">
          <div @click="activeFilter = 'All'"
               class="group cursor-pointer text-center space-y-3 transition-all">
            <div :class="[
              'relative aspect-square rounded-full flex items-center justify-center transition-all duration-500 border',
              activeFilter === 'All' ? 'bg-white shadow-xl shadow-slate-100 border-slate-100 scale-110' : 'bg-transparent border-transparent hover:border-slate-100'
            ]">
              <span :class="['text-xs font-bold transition-colors', activeFilter === 'All' ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400']">
                All
              </span>
            </div>
            <div :class="['text-[10px] tracking-widest font-medium transition-opacity', activeFilter === 'All' ? 'opacity-100 text-slate-500' : 'opacity-0']">
              全體
            </div>
          </div>

          <div v-for="(config, name) in subjectConfigs" :key="name"
               @click="activeFilter = name"
               class="group cursor-pointer text-center space-y-3 transition-all">
            <div :class="[
              'relative aspect-square rounded-full flex items-center justify-center transition-all duration-500 border',
              activeFilter === name ? 'bg-white shadow-xl shadow-slate-100 border-slate-100 scale-110' : 'bg-transparent border-transparent hover:border-slate-100'
            ]">
              <svg class="w-full h-full absolute p-2 transform -rotate-90">
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" stroke-width="1" fill="transparent" class="text-slate-50" />
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" stroke-width="1.5" fill="transparent" 
                        :style="{ 
                          color: getSubjectBaseColor(name), 
                          strokeDasharray: '280', 
                          strokeDashoffset: '80', 
                          opacity: activeFilter === name ? 1 : 0.2 
                        }" />
              </svg>
              <span :class="['text-xs font-bold transition-colors', activeFilter === name ? 'text-slate-900' : 'text-slate-300 group-hover:text-slate-400']">
                {{ name[0] }}
              </span>
            </div>
            <div :class="['text-[10px] tracking-widest font-medium transition-opacity', activeFilter === name ? 'opacity-100 text-slate-500' : 'opacity-0']">
              {{ name }}
            </div>
          </div>
        </div>

        <div class="space-y-12">
          <div v-if="filteredBugs.length > 0" class="grid grid-cols-1 gap-12">
            <TransitionGroup name="list">
              <div v-for="(bug, index) in filteredBugs" :key="bug.id" 
                   class="group relative flex items-start gap-10">
                
                <div class="hidden md:block">
                  <span class="text-6xl font-black italic text-slate-50 group-hover:text-blue-50/50 transition-colors duration-500 leading-none">
                    {{ (index + 1).toString().padStart(2, '0') }}
                  </span>
                </div>

                <div class="flex-grow pt-2">
                  <div class="flex items-center gap-4 mb-3">
                    <span class="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" :style="{ color: getSubjectBaseColor(bug.subject) }"></span>
                    <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      {{ bug.subject }} · 
                      {{ 
                        typeof bug.category === 'string' && bug.category.startsWith('[') 
                          ? JSON.parse(bug.category).join(' / ') 
                          : (Array.isArray(bug.category) ? bug.category.join(' / ') : bug.category)
                      }}
                    </span>
                  </div>
                  
                  <h3 class="text-2xl font-normal text-slate-800 mb-3 group-hover:translate-x-1 transition-transform duration-300">
                    {{ bug.title }}
                  </h3>
                  
                  <p class="text-slate-400 text-sm font-light leading-relaxed max-w-xl mb-6">
                    {{ bug.summary }}
                  </p>

                  <div class="flex items-center gap-6">
                    <button @click="startPatch(bug)" 
                            class="px-8 py-2.5 bg-white border border-slate-100 rounded-full text-[11px] font-bold text-slate-600 shadow-sm hover:shadow-md hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 uppercase tracking-widest">
                      Start Calibration
                    </button>
                    <span class="text-[10px] font-mono text-slate-300">DETECTED: {{ bug.date }}</span>
                  </div>
                </div>

                <div class="absolute -left-4 top-0 bottom-0 w-[1px] bg-slate-50 group-hover:bg-slate-100 transition-colors"></div>
              </div>
            </TransitionGroup>
          </div>

          <div v-else-if="!isLoading" class="text-center py-40">
            <div class="text-xs tracking-[0.5em] text-slate-300 uppercase font-light">Stability Optimized</div>
            <div class="mt-4 text-slate-200 text-5xl font-extralight italic">Clear.</div>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const subjectConfigs = inject('subjectConfigs');
const userConfig = inject('userConfig');
const { getValidConfig } = useAuth();

const allBugs = ref([]);
const isLoading = ref(true); // 預設為 true，進入頁面即顯示讀取
const activeFilter = ref('All');
let isFetching = false; 

const getSubjectBaseColor = (subjectName) => {
  if (!subjectConfigs || !subjectConfigs[subjectName]) return '#cbd5e1';
  const config = subjectConfigs[subjectName];
  const firstCat = config.cats[0];
  return config.colors[firstCat] || '#cbd5e1';
};

const loadBugs = async () => {
  if (process.server || isFetching) return; 
  
  // 🚩 門禁介入：取代原本手動 getSessionData 的邏輯
  const auth = getValidConfig(true);

  if (!auth) {
    isLoading.value = false;
    return;
  }

  // 🚩 資料對齊：將門禁回傳的資料轉為原本代碼使用的 session 變數格式
  // 這樣後面的 res = await $fetch 邏輯完全不需要更動
  const session = {
    id: auth.student_id,
    sid: auth.sheet_id
  };

  if (!session.id) {
    isLoading.value = false;
    return;
  }

  isFetching = true;
  isLoading.value = true;
  
  try {
    const res = await $fetch('/api/clinic-all', {
      query: { 
        studentId: session.id, // 保持原本的參數名稱
        sheetId: session.sid,   // 保持原本的參數名稱
        t: Math.floor(Date.now() / 5000) 
      } 
    });

    if (res.success) {
      allBugs.value = res.data || [];
    }
  } catch (err) {
    console.error('API 請求異常:', err);
  } finally {
    // 延遲關閉，確保視覺過渡平滑 (原本的 400ms 保持不變)
    setTimeout(() => {
      isLoading.value = false;
      isFetching = false; 
    }, 400);
  }
};

const filteredBugs = computed(() => {
  if (activeFilter.value === 'All') return allBugs.value;
  const targetCats = subjectConfigs[activeFilter.value]?.cats || [];
  return allBugs.value.filter(b => {
    return b.subject === activeFilter.value || targetCats.includes(b.category);
  });
});

// 🌟 分類切換的載入感
watch(activeFilter, () => {
  isLoading.value = true;
  setTimeout(() => {
    isLoading.value = false;
  }, 300);
});

// 跳轉到診斷頁
const startPatch = (bug) => {
  router.push({
    path: '/clinic', 
    query: { 
      subject: bug.subject, 
      title: bug.title,
      mode: 'patch'
    }
  });
};

onMounted(() => {
  loadBugs();
});

// 監聽用戶變動
watch(() => userConfig?.student_id, (newId) => {
  if (newId) loadBugs();
}, { immediate: true });

</script>

<style scoped>
/* 列表過渡動畫 */
.list-enter-active, .list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 🌟 全域載入遮罩樣式 */
.global-loader-overlay {
  position: fixed; /* 改為 fixed 以覆蓋全域 */
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px); /* 磨砂玻璃效果 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loader-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loader-text {
  margin-top: 20px;
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  color: #64748b;
}

/* 漸變動畫 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
