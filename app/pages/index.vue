<template>
  <ClientOnly>
    <div class="min-h-screen bg-[#FDFDFE] p-10 text-slate-800 relative">
      
      <transition name="fade">
        <div v-if="isLoading" class="global-loader-overlay">
          <div class="loader-spinner"></div>
          <div class="loader-text font-mono tracking-[0.2em] uppercase text-blue-600/70 max-w-sm text-center px-6">
            {{'正在偵測核心弱點...' }}
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

        <transition name="typewriter-fade">
          <div v-if="!isLoading && agentMessage" class="mt-8 mb-4 group relative overflow-hidden">
            <div class="p-6 bg-[#fdfdfd] border border-slate-200/60 rounded-[2.5rem] shadow-sm transition-all duration-500 hover:shadow-md">
              <div class="flex items-start gap-5">
                <div class="flex-shrink-0 w-16 h-16 rounded-full p-1 bg-white shadow-sm border border-slate-100 overflow-hidden 
                            flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                  
                  <span class="text-4xl grayscale-[0.2] group-hover:grayscale-0 transition-all duration-300">
                    🌱
                  </span>

              </div>
        
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-3 mb-1 flex-wrap">
            <span class="text-[13px] font-bold text-slate-500 tracking-[0.15em]">學習觀察筆記</span>
            
            <div v-if="!agentMessage.includes('任務已經達成')" class="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 rounded-full border border-blue-100">
              <span class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
              <span class="text-[9px] text-blue-500 font-bold tracking-tighter">AI 數據分析已同步</span>
            </div>
            <div v-else class="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200">
              <span class="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
              <span class="text-[9px] text-slate-500 font-bold tracking-tighter">自主思考模式</span>
            </div>

            <span class="text-[10px] font-mono text-slate-400">
              {{ new Date().toLocaleDateString('zh-TW').replace(/\//g, ' . ') }}
            </span>
            <span class="text-[10px] text-orange-500/90 border border-orange-100 px-2 py-0.5 rounded-full bg-orange-50/50">溫馨提醒</span>
          </div>

          <p class="text-xl md:text-2xl text-slate-700 font-sans font-medium leading-relaxed tracking-tight min-h-[3em]">
            {{ displayText }}
            <span v-if="displayText.length < agentMessage.length" class="inline-block w-1 h-5 bg-blue-400 ml-1 animate-pulse"></span>
          </p>
        </div>
      </div>
    </div>
  </div>
</transition>

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
const isLoading = ref(true); 
const activeFilter = ref('All');
const agentMessage = ref('');
const isAgentThinking = ref(false); 
const displayText = ref("");  
let typingTimer = null;
let isFetching = false; 

const getSubjectBaseColor = (subjectName) => {
  if (!subjectConfigs || !subjectConfigs[subjectName]) return '#cbd5e1';
  const config = subjectConfigs[subjectName];
  const firstCat = config.cats[0];
  return config.colors[firstCat] || '#cbd5e1';
};

const loadBugs = async () => {
  if (process.server || isFetching) return; 
  
  const auth = getValidConfig(true);
  if (!auth) {
    isLoading.value = false;
    return;
  }

  isFetching = true;
  isLoading.value = true;
  
  const today = new Date().toDateString();
  const lastSyncDate = localStorage.getItem('agent_last_sync_date');
  const cachedGreeting = localStorage.getItem('agent_daily_greeting');

  if (lastSyncDate === today && cachedGreeting) {
    agentMessage.value = cachedGreeting;
  }

  try {
    const targetSheetName = `${auth.userName}_Clinic`;
    const gasUrl = localStorage.getItem('user_gas_url');

    const response = await fetch(gasUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' 
      },
      body: JSON.stringify({
        action: 'fetch_data',
        sheetName: targetSheetName
      })
    });

    const res = await response.json();

    if (res.success && res.data) {
      allBugs.value = res.data
        .filter(r => {
          const isMastered = String(r.is_mastered || r.Mastered || '').trim().toUpperCase();
          return isMastered !== 'TRUE' && (r.title || r.Title);
        })
        .map((r, index) => ({
          id: r.id || `${auth.userName}-${index}`,
          subject: r.subject || r.Category || (targetSheetName.split('_')[0]),
          category: r.tags || r.Category || '一般',
          title: r.title || r.Title,
          summary: r.summary || r['Knowledge Point'] || r.ai_explanation || '',
          date: r.date || r.Date || '2024-01-01'
        }));

      if (allBugs.value.length > 0) {
        if (lastSyncDate !== today || !cachedGreeting) {
          // 只有今天還沒同步過，才真正去騷擾 Gemini
          triggerAgentGreeting(allBugs.value);
        }
      }
    } else {
      console.warn('GAS 回傳失敗:', res.error);
    }
  } catch (err) {
    console.error('GAS 讀取異常:', err);
  } finally {
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

const triggerAgentGreeting = async (bugs) => {
  const auth = getValidConfig(); 
  if (!auth) {
    agentMessage.value = "系統配置未完成，請先登入設定。";
    return;
  }

  if (!bugs || bugs.length === 0) {
    agentMessage.value = "目前邏輯架構穩定，核心效能運作良好。";
    return;
  }

  isAgentThinking.value = true;

  try {
    const errorBrief = bugs.slice(0, 5).map(q => q.title || '未知任務').join('、');

    const result = await $fetch('/api/analyze-clinic', {
      method: 'POST',
      body: {
        student_id: auth.student_id,
        studentName: auth.userName,
        subject: activeFilter.value === 'All' ? '全學科' : activeFilter.value,
        errors: errorBrief,
        mode: 'greeting',
        userConfig: { gemini_key: auth.gemini_key }
      }
    }).catch(err => {
      return { success: false, message: err.data?.message || err.message };
    });

    if (!result || result.success === false) {
      const errorMsg = result?.message || '';
      if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        const quotaMessage = "今天的數據分析任務已經圓滿達成！接下來的時間，是屬於你自己的思考派對。相信你的判斷，直接出發去解決下一個難題吧！";
        agentMessage.value = quotaMessage;
        updateLocalAndCloudGreeting(quotaMessage); 
        return;
      }
      throw new Error(errorMsg || 'AGENT_GREETING_FAILED');
    }

    if (result.greeting) {
      updateLocalAndCloudGreeting(result.greeting);
    }

  } catch (e) {
    console.warn("Agent 留言生成失敗:", e);
    const fallbackMsg = "準備好修復今天的邏輯漏洞了嗎？我們出發吧！";
    updateLocalAndCloudGreeting(fallbackMsg);
  } finally {
    isAgentThinking.value = false;
    setTimeout(() => {
      isLoading.value = false; 
    }, 500);
  }
};

const updateLocalAndCloudGreeting = (msg) => {
  const today = new Date().toDateString();
  
  agentMessage.value = msg;

  localStorage.setItem('agent_daily_greeting', msg);
  localStorage.setItem('agent_last_sync_date', today);
  
  saveAgentLogToSheet(msg);
};

const saveAgentLogToSheet = async (newGreeting) => {
  const auth = getValidConfig();
  const gasUrl = localStorage.getItem('user_gas_url');
  const targetSheetName = `${auth.userName}_Config`;
  if (!gasUrl) return;

  try {
    const res = await $fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
      body: JSON.stringify({ 
        action: 'update_config',
        sheetName: targetSheetName,
        key: 'daily_greeting',
        value: newGreeting
      })
    });
  } catch (err) {
    console.error("寫入 Config 失敗:", err);
  }
};
  

const startTyping = (text) => {
  if (!text) return;
  if (typingTimer) clearInterval(typingTimer);
  
  displayText.value = ""; 
  let i = 0;
  
  setTimeout(() => {
    typingTimer = setInterval(() => {
      if (i < text.length) {
        displayText.value += text.charAt(i);
        i++;
      } else {
        clearInterval(typingTimer);
      }
    }, 40); 
  }, 600); 
};

watch(isLoading, (newVal) => {
  if (newVal === false && agentMessage.value) {
    startTyping(agentMessage.value);
  }
});

watch(agentMessage, (newVal) => {
  if (!isLoading.value && newVal) {
    startTyping(newVal);
  }
});

watch(activeFilter, () => {
  isLoading.value = true;
  setTimeout(() => {
    isLoading.value = false;
  }, 300);
});

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

watch(() => userConfig?.student_id, (newId) => {
  if (newId) loadBugs();
}, { immediate: true });

</script>

<style scoped>
.list-enter-active, 
.list-leave-active {
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

.global-loader-overlay {
  position: fixed;
  top: 0; 
  left: 0; 
  right: 0; 
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
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
  text-transform: uppercase;
}

.fade-enter-active, 
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, 
.fade-leave-to {
  opacity: 0;
}

.typewriter-fade-enter-active {
  transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.typewriter-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
</style>
