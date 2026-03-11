<template>
  <div class="max-w-6xl mx-auto py-8 px-4 space-y-10 animate-in fade-in duration-700">
    
    <div class="flex gap-3 mb-2 overflow-x-auto pb-2 no-scrollbar border-b border-gray-50">
      <button 
        v-for="(config, name) in subjectConfigs" 
        :key="name"
        @click="selectedSubject = name"
        :class="[
          'px-5 py-2 rounded-full text-[11px] tracking-widest transition-all duration-300 whitespace-nowrap',
          selectedSubject === name 
            ? 'bg-[#333333] text-white shadow-lg shadow-gray-200' 
            : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
        ]"
      >
        {{ name }}
      </button>
    </div>
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
      <div>
        <h1 class="text-2xl font-black text-gray-800 tracking-wider">教學戰情室</h1>
        <p class="text-xs text-gray-400 uppercase tracking-widest mt-1">Classroom Analytics & Mastery Overview</p>
        
        <div class="flex bg-gray-100 p-1 rounded-2xl w-fit mt-6">
          <button @click="activeTab = 'exam'" 
            :class="activeTab === 'exam' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'"
            class="px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2">
            <span>📝</span> 考卷診斷
          </button>
          <button @click="activeTab = 'quiz'" 
            :class="activeTab === 'quiz' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'"
            class="px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2">
            <span>⚡</span> 隨堂小考
          </button>
          <button @click="activeTab = 'stats'" 
            :class="activeTab === 'stats' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'"
            class="px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2">
            <span>📊</span> 成長數據
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'quiz'" class="flex items-center gap-3">
         <select v-model="selectedSessionId" class="bg-gray-50 border-none px-4 py-2 rounded-xl text-xs font-bold text-gray-600 outline-none cursor-pointer">
            <option v-for="s in quizSessions" :key="s.sessionId" :value="s.sessionId">
              {{ s.date }} - {{ s.topic }}
            </option>
          </select>
          <button @click="fetchQuizData" class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xs">🔄</button>
      </div>

<div v-else-if="activeTab === 'exam'" class="flex flex-wrap items-center gap-3 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
  
  <div class="flex items-center gap-2 px-3 border-r border-gray-200">
    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">卷別名稱</span>
    <select 
      v-model="filters.date" 
      @change="refreshStats" 
      class="bg-transparent border-none py-1.5 text-xs font-bold text-[#0747A6] outline-none cursor-pointer focus:ring-0 max-w-[180px]"
    >
      <option value="">全部卷別</option>
      <option v-for="name in availableDates" :key="name" :value="name">
        {{ name }}
      </option>
    </select>
  </div>

  <div class="flex items-center gap-2 px-3">
    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">科目領域</span>
    <select 
      v-model="filters.category" 
      @change="refreshStats" 
      class="bg-transparent border-none py-1.5 text-xs font-bold text-[#0747A6] outline-none cursor-pointer focus:ring-0"
    >
      <option value="">所有領域</option>
      <option v-for="cat in (subjectConfigs[selectedSubject]?.cats || [])" :key="cat" :value="cat">
        {{ cat }}
      </option>
    </select>
  </div>

  <button @click="refreshStats" class="w-8 h-8 flex items-center justify-center hover:bg-white rounded-xl transition-all text-gray-400 hover:text-blue-600">
    <span :class="{ 'animate-spin': loading }">🔄</span>
  </button>
</div>
    </div>

    <template v-if="activeTab === 'exam'">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <p class="text-[10px] text-[#0747A6] font-black uppercase tracking-[0.2em] mb-3">平均掌握度</p>
          <div class="flex items-baseline gap-2">
            <span class="text-5xl font-serif font-black text-gray-800">{{ classAverage }}</span>
            <span class="text-sm font-bold text-gray-400">%</span>
          </div>
          <div class="mt-4 h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
            <div class="h-full bg-blue-500 transition-all duration-1000" :style="{ width: classAverage + '%' }"></div>
          </div>
        </div>
        <div class="bg-rose-50/50 p-8 rounded-[40px] border border-rose-100 shadow-sm">
          <p class="text-[10px] text-rose-500 font-black uppercase tracking-[0.2em] mb-3">急需加強知識點</p>
          <div class="text-xl font-black text-gray-800 truncate">{{ topWrongConcept?.title || '數據掃描中' }}</div>
          <p class="text-[10px] text-rose-400 font-bold mt-2 uppercase">已有 {{ topWrongConcept?.wrongCount || 0 }} 人在此觀念出錯</p>
        </div>
        <div class="bg-emerald-50/50 p-8 rounded-[40px] border border-emerald-100 shadow-sm">
          <p class="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mb-3">班級狀態</p>
          <div class="text-xl font-black text-gray-800">
            {{ classAverage > 80 ? '表現優異' : (classAverage > 60 ? '穩定成長' : '需要補救') }}
          </div>
          <p class="text-[10px] text-emerald-400 font-bold mt-2 uppercase">依目前篩選條件評估</p>
        </div>
      </div>
      <div class="space-y-6">
        <div class="flex items-center justify-between ml-2">
          <h3 class="text-sm font-black text-gray-800 tracking-widest uppercase">🔥 全班知識點歸納</h3>
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total: {{ displayLabels.length }} Concepts</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="label in displayLabels" :key="label.title" class="p-8 rounded-[40px] border bg-white border-gray-100">
            <div class="flex justify-between items-start mb-6">
              <div>
                <span class="text-[9px] font-black uppercase px-2 py-1 rounded bg-gray-100 text-gray-500 mb-3 inline-block"
                  :style="{ backgroundColor: categoryColors[label.cat] + '15', color: categoryColors[label.cat] }">{{ label.cat }}</span>
                <h4 class="text-lg font-black text-gray-800">{{ label.title }}</h4>
              </div>
              <div class="text-right bg-rose-50 px-4 py-2 rounded-2xl">
                <span class="text-2xl font-serif font-black text-rose-500">{{ label.wrongCount }}</span>
                <p class="text-[9px] text-rose-300 font-bold uppercase">人答錯</p>
              </div>
            </div>
            <div class="p-5 bg-gray-50/50 rounded-[24px] mb-6 italic text-sm text-gray-500">
              <span class="text-blue-600 font-bold not-italic">AI 建議：</span>
              {{ label.wrongCount > 3 ? '建議於下次上課進行 15 分鐘的集體觀念澄清。' : '此為少數學生誤解，可安排個別輔導。' }}
            </div>
            <div class="flex items-center gap-4">
              <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-rose-400 transition-all duration-1000" :style="{ width: label.rate }"></div>
              </div>
              <span class="text-[10px] font-black text-gray-400">{{ label.rate }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="activeTab === 'quiz'">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="md:col-span-3 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-sm font-black text-gray-800 uppercase tracking-widest">📊 隨堂測驗參與名單</h3>
            <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">實時狀態掃描</span>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="student in quizStudentsList" :key="student.id" 
              class="flex items-center justify-between p-4 rounded-2xl border transition-all"
              :class="getQuizScore(student.id) !== null ? 'bg-emerald-50/30 border-emerald-100' : 'bg-gray-50/50 border-gray-100'">
              <div class="flex flex-col">
                <span class="text-sm font-black text-gray-800">{{ student.name }}</span>
                <span class="text-[9px] text-gray-400 font-bold">ID: {{ student.id }}</span>
              </div>
              <div class="text-right">
                <div v-if="getQuizScore(student.id) !== null">
                  <span class="text-lg font-serif font-black text-emerald-600">{{ getQuizScore(student.id) }}</span>
                  <span class="text-[8px] text-emerald-400 ml-0.5 font-bold">pts</span>
                </div>
                <div v-else class="text-[9px] text-gray-300 italic font-bold uppercase">未挑戰</div>
              </div>
            </div>
          </div>
        </div>

      <div class="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm relative overflow-hidden">
  <div class="absolute -top-6 -right-6 w-20 h-20 bg-indigo-50/50 rounded-full blur-2xl"></div>

  <div class="relative z-10">
    <div class="mb-5">
      <h3 class="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Live Completion</h3>
      <div class="flex items-baseline gap-1">
        <span class="text-5xl font-serif font-black text-slate-800 leading-none">{{ completionRate }}</span>
        <span class="text-xl font-black text-indigo-500">%</span>
      </div>
    </div>

    <div class="mb-4">
      <div class="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          class="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
          :style="{ width: `${completionRate}%` }"
        ></div>
      </div>
    </div>

    <div class="space-y-3">
      <div class="flex flex-col">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">已繳交 / 應繳交</span>
        <div class="flex items-center gap-2">
          <span class="text-lg font-black text-slate-700">{{ currentCompletedCount }}</span>
          <span class="text-slate-300">/</span>
          <span class="text-sm font-bold text-slate-400">{{ quizStudentsList.length }} 人</span>
        </div>
      </div>

      <div class="pt-3 border-t border-gray-50 flex justify-between items-center">
        <span class="text-[9px] font-bold text-slate-300 uppercase tracking-widest text-nowrap">Real-time sync</span>
        <span class="flex items-center gap-1.5 text-emerald-500 scale-90">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-[9px] font-black uppercase">Live</span>
        </span>
      </div>
    </div>
  </div>
</div>
      </div>
    </template>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div v-for="metric in overallMetricsList" :key="metric.label" class="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm text-center">
          <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4">{{ metric.label }}</p>
          <div class="text-4xl font-serif font-black text-gray-800">{{ metric.value }}</div>
          <p v-if="metric.trend !== undefined" class="text-[10px] mt-2 font-bold" :class="metric.trend > 0 ? 'text-emerald-500' : 'text-rose-500'">
            {{ metric.trend > 0 ? '↑' : '↓' }} {{ Math.abs(metric.trend) }}% <span class="text-gray-300 ml-1">基準線</span>
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-sm font-black text-gray-800 uppercase tracking-widest">🏆 學習榮譽榜</h3>
            <span class="text-[10px] font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase">Mastery Top 10</span>
          </div>
          <div class="space-y-4">
           <div v-for="(student, index) in combinedStudentStats.sort((a, b) => b.combinedMastery - a.combinedMastery).slice(0, 10)" :key="student.id" 
  class="flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-gray-50 border border-transparent hover:border-gray-100">
  <div class="flex items-center gap-4">
    <div class="w-8 h-8 flex items-center justify-center font-black rounded-lg text-sm"
      :class="index < 3 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'">
      {{ index + 1 }}
    </div>
    <div class="flex flex-col">
      <div class="text-sm font-black text-gray-800">{{ student.name }}</div>
      <div class="text-[9px] text-gray-400 font-bold">小考: {{ student.quizAverage ?? '--' }} | 大考: {{ student.examMastery ?? '--' }}</div>
    </div>
  </div>
  <div class="flex items-center gap-6">
    <div class="text-right min-w-[50px]">
      <span class="text-sm font-black text-[#0747A6]">{{ student.combinedMastery }}%</span>
    </div>
  </div>
</div>
          </div>
        </div>

        <div class="space-y-8">
          <div class="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-sm font-black text-gray-800 uppercase tracking-widest">⚠️ 學習風險預警</h3>
              <span class="px-3 py-1 bg-rose-100 text-rose-600 text-[9px] font-black rounded-full">需關注</span>
            </div>
            <div class="space-y-4">
              <div v-for="student in realRiskStudents" :key="student.name" class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center font-bold text-[#0747A6] shadow-sm">{{ student.name[0] }}</div>
                  <div>
                    <div class="text-sm font-black text-gray-800">{{ student.name }}</div>
                    <div class="text-[10px] text-rose-400 font-medium">{{ student.reason }}</div>
                  </div>
                </div>
              </div>
              <div v-if="realRiskStudents.length === 0" class="py-4 text-center text-gray-400 text-[10px] italic">全班狀態良好</div>
            </div>
          </div>

          <div class="bg-[#0747A6] p-10 rounded-[40px] text-white shadow-xl shadow-blue-900/20">
            <h3 class="text-sm font-black uppercase tracking-widest mb-8 text-blue-200">📊 領域平均</h3>
            <div class="space-y-6">
              <div v-for="(color, cat) in categoryColors" :key="cat">
                <div class="flex justify-between text-[10px] font-black uppercase mb-2 tracking-widest">
                  <span>{{ cat }}</span>
                  <span>{{ getCatAverage(cat) }}%</span>
                </div>
                <div class="h-1.5 w-full bg-blue-900/50 rounded-full overflow-hidden">
                  <div class="h-full bg-white transition-all duration-1000" :style="{ width: getCatAverage(cat) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="loading" class="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="flex flex-col items-center">
        <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-[10px] font-black text-blue-600 uppercase tracking-widest">分析數據中...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject, watch } from 'vue'; // ✨ 加入 watch

const userConfig = inject('userConfig');
const subjectConfigs = inject('subjectConfigs'); // ✨ 注入科目配置
const selectedSubject = ref(Object.keys(subjectConfigs)[0]); // ✨ 預設選取第一科

const activeTab = ref('exam');
const loading = ref(false);

// --- 數據存儲 ---
const classSummary = ref([]);
const availableDates = ref([]);
const filters = reactive({ date: '', category: '' });
const overallStats = ref(null);
const realRiskStudents = ref([]);
const classRankings = ref([]);

// --- 隨堂小考專用 ---
const quizSessions = ref([]);
const quizScoresMap = ref({}); // { sessionId: { studentId: score } }
const quizStudentsList = ref([]); // 名單從 API 直接同步
const selectedSessionId = ref('');

const currentSubjectCats = computed(() => {
  return subjectConfigs[selectedSubject.value]?.cats || [];
});

const categoryColors = { 
  '基礎樂理': '#0747A6', '西洋音樂史': '#10B981', '中國音樂史': '#F59E0B', '樂器學': '#8B5CF6' 
};

// --- 計算屬性：原本考卷診斷 ---
const overallMetricsList = computed(() => {
  const allMastery = combinedStudentStats.value.map(s => s.combinedMastery);
  const avg = allMastery.length ? Math.round(allMastery.reduce((a, b) => a + b, 0) / allMastery.length) : 0;
  
  return [
    { label: '全維度平均分', value: avg + '%', trend: 2.1 }, // 這裡變成了整合平均
    { label: '總作答數', value: overallStats.value?.totalSubmissions || 0, trend: 10.5 },
    { label: '學生人數', value: quizStudentsList.value.length },
    { label: '需關注人數', value: realRiskStudents.value.length, trend: -1.2 }
  ];
});

const classAverage = computed(() => {
  if (classSummary.value.length === 0) return 0;
  const total = classSummary.value.reduce((acc, cur) => acc + (cur.count || 0), 0);
  const wrongs = classSummary.value.reduce((acc, cur) => acc + (cur.wrongCount || 0), 0);
  return total ? Math.round(((total - wrongs) / total) * 100) : 0;
});

const displayLabels = computed(() => {
  return classSummary.value
    .filter(g => g.wrongCount > 0)
    .map(g => ({
      title: g.title,
      cat: g.cat || '基礎樂理',
      wrongCount: g.wrongCount,
      rate: g.count > 0 ? Math.round((g.wrongCount / g.count) * 100) + '%' : '0%'
    }))
    .sort((a, b) => b.wrongCount - a.wrongCount);
});

const topWrongConcept = computed(() => displayLabels.value[0] || null);

// --- ✨ 隨堂小考計算屬性 ---
// 修正後的 getQuizScore


const getQuizScore = (studentId) => {
  if (!selectedSessionId.value) return null;
  const sessionScores = quizScoresMap.value[selectedSessionId.value];
  if (!sessionScores) return null;

  const sid = String(studentId).trim();

  // 1. 先用 ID 匹配 (如 emma123)
  if (sessionScores[sid] !== undefined) return sessionScores[sid];

  // 2. 如果 ID 匹配失敗，改用「姓名」匹配
  // 先去學生名單中找出 emma123 的名字叫什麼
  const currentStudent = quizStudentsList.value.find(s => String(s.id).trim() === sid);
  
  if (currentStudent && currentStudent.name) {
    const targetName = currentStudent.name.trim();
    
    // 因為我們在 fetchQuizData 裡已經把姓名也存進 sessionScores 了
    // 所以這裡直接用名字當 Key 就能抓到分數！
    if (sessionScores[targetName] !== undefined) {
      return sessionScores[targetName];
    }
  }

  return null; // 真的都對不上，才是未挑戰
};

const currentCompletedCount = ref(0);

const completionRate = computed(() => {
  const totalStudents = quizStudentsList.value.length;
  // 如果沒選場次或沒學生，完成率就是 0
  if (totalStudents === 0 || !selectedSessionId.value) return 0;

  // 1. 取得當前選中場次的成績資料
  const currentSessionScores = quizScoresMap.value[selectedSessionId.value];
  if (!currentSessionScores) return 0;

  // 2. 計算「目前這場」有幾個人完成了 (不重複計算)
  const completedInThisSession = quizStudentsList.value.filter(student => {
    const sid = String(student.id).trim();
    const name = student.name.trim();
    // 只要 ID 或 姓名 其中一個在該場次有分數，就算完成
    return currentSessionScores[sid] !== undefined || currentSessionScores[name] !== undefined;
  }).length;

  // 3. 更新全域變數，讓 UI 可以顯示 "1 / 2"
  currentCompletedCount.value = completedInThisSession;

  // 4. 計算百分比：(本場完成人數 / 班級總人數) * 100
  const rate = (completedInThisSession / totalStudents) * 100;
  return Math.round(rate);
});


const quizAverageScore = computed(() => {
  if (!selectedSessionId.value) return '--';
  const sessionScores = quizScoresMap.value[selectedSessionId.value] || {};
  const scores = Object.values(sessionScores).map(Number).filter(n => !isNaN(n));
  if (scores.length === 0) return '--';
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
});

// --- API 請求：原本考卷診斷 ---
// 找到 refreshStats 函數並修改這一段
const refreshStats = async () => {
  loading.value = true;
  try {
    const response = await $fetch('/api/assignments', {
      params: { 
        studentId: 'all', 
        t: Date.now() 
      }
    });

    if (response && response.success) {
      // --- 1. 抓取當前大科目的子領域 (cats) ---
      const currentCats = subjectConfigs[selectedSubject.value]?.cats || [];
      
      // --- 2. 過濾出屬於該大科目的所有題目 (只抓老師的) ---
      const allRawQuestions = (response.questions || []).filter(q => {
        const author = String(q.userName || '').toLowerCase().trim();
        const isTeacher = author === '' || author.includes('teacher');
        return isTeacher && currentCats.includes(q.category);
      });
      
     // --- 3. ✨ 強化「卷別名稱」抓取邏輯 ---
      const assignmentNames = allRawQuestions
        .map(q => {
          // 這裡依照順序嘗試抓取可能的名稱欄位
          // 1. q.title (原本的)
          // 2. q.assignment_name (常見的考卷名稱欄位)
          // 3. q.test_name (另一種可能的欄位)
          const name = q.title || q.assignment_name || q.test_name || (q.date ? String(q.date).split(' ')[0] : null);
          return name;
        })
        .filter(n => n && String(n).trim() !== '');
      
      // 去重並排序
      availableDates.value = [...new Set(assignmentNames)].sort((a, b) => b.localeCompare(a));

      // --- 4. 根據捲別進行二次過濾 (同步強化比對邏輯) ---
      const filteredQuestions = allRawQuestions.filter(q => {
        // 比對時也要用同樣的優先順序來尋找識別標籤
        const qIdentifier = q.title || q.assignment_name || q.test_name || (q.date ? String(q.date).split(' ')[0] : '');
        const nameMatch = !filters.date || qIdentifier === filters.date;
        const catMatch = !filters.category || q.category === filters.category;
        return nameMatch && catMatch;
      });

      // --- 5. 重新計算知識點彙整 (Summary) ---
      const newSummaryMap = {};
      filteredQuestions.forEach(q => {
        const kp = q.knowledge_point || '未分類';
        if (!newSummaryMap[kp]) {
          newSummaryMap[kp] = { title: kp, count: 0, wrongCount: 0, cat: q.category || '一般' };
        }
        newSummaryMap[kp].count++;
        if (q.is_wrong === true || q.is_wrong === 'TRUE' || q.is_mastered === 'FALSE') {
          newSummaryMap[kp].wrongCount++;
        }
      });
      classSummary.value = Object.values(newSummaryMap).sort((a, b) => b.wrongCount - a.wrongCount);
      
      // --- 6. 更新其他數據 (Risk, Rankings, Students) ---
      if (response.overallStats) {
        overallStats.value = response.overallStats;
        realRiskStudents.value = response.overallStats.riskStudents || [];
      }
      if (response.rankings) classRankings.value = response.rankings;
      
      if (response.students) {
        const studentsOnly = response.students.filter(s => s.role === 'student');
        const seen = new Set();
        const cleanList = [];
        studentsOnly.forEach(s => {
          const cleanId = String(s.id).trim();
          if (!seen.has(cleanId)) {
            seen.add(cleanId);
            cleanList.push({ id: cleanId, name: s.name });
          }
        });
        quizStudentsList.value = cleanList;
      }
    }
  } catch (err) {
    console.error("刷新失敗:", err);
  } finally {
    loading.value = false;
  }
};

// --- ✨ 隨堂小考資料刷新 (適應不變的 gsheet-fetch.get.js) ---
const fetchQuizData = async () => {
  const targetSheetId = userConfig?.sheet_id;
  if (!targetSheetId) return;

  loading.value = true;
  try {
    const sessionRes = await $fetch('/api/gsheet-fetch', { 
      params: { studentId: 'teacher', sheetId: targetSheetId, range: 'Sessions!A2:I' } 
    });

    const resultsRes = await $fetch('/api/gsheet-fetch', { 
      params: { studentId: 'teacher', sheetId: targetSheetId, range: 'QuizResults!A2:G' } 
    });

    // --- 1. 處理成績數據 (保持您原本的功能邏輯) ---
    const resultsData = Array.isArray(resultsRes) ? resultsRes : (resultsRes.data || []);
    const sMap = {};

    resultsData.forEach(res => {
      const sessionId = res.sessionId;
      const studentId = String(res.StudentId || '').trim();
      const studentName = String(res.StudentName || '').trim();
      const score = res.Score !== undefined ? res.Score : 0;

      if (sessionId) {
        if (!sMap[sessionId]) sMap[sessionId] = {};
        if (studentId) sMap[sessionId][studentId] = score;
        if (studentName) sMap[sessionId][studentName] = score; 
      }
    });

    quizScoresMap.value = sMap;

    // --- 2. 處理 Session 列表 (新增過濾：只顯示老師發起的場次) ---
    const sData = Array.isArray(sessionRes) ? sessionRes : (sessionRes.data || []);
    
    quizSessions.value = sData
      .filter(s => {
        // ✨ 新增過濾：userName 為空或包含 teacher
        const author = String(s.userName || s.UserName || '').toLowerCase().trim();
        return author === '' || author.includes('teacher');
      })
      .map(s => ({
        sessionId: s.sessionId,
        date: s.Date || s.date || '',
        topic: s.Topic || s.topic || '未命名課堂'
      }))
      .reverse();

    // 預設選取最新的一場
    if (quizSessions.value.length > 0 && !selectedSessionId.value) {
      selectedSessionId.value = quizSessions.value[0].sessionId;
    }
  } catch (err) {
    console.error("❌ Quiz 數據獲取失敗", err);
  } finally {
    loading.value = false;
  }
};

const getCatAverage = (cat) => {
  const groups = classSummary.value.filter(g => g.cat === cat);
  if (groups.length === 0) return 70;
  const total = groups.reduce((acc, cur) => acc + (cur.count || 0), 0);
  const wrongs = groups.reduce((acc, cur) => acc + (cur.wrongCount || 0), 0);
  return total ? Math.round(((total - wrongs) / total) * 100) : 70;
};


// ✨ 新增：整合所有成績（考卷 + 隨堂小考）
// 在 computed 內定義局部變數，確保不影響外部功能
const combinedStudentStats = computed(() => {
  if (!quizStudentsList.value.length) return [];

  // 定義顯示用的權重 (僅在此計算屬性內有效)
  const EXAM_WEIGHT = 0.6; 
  const QUIZ_WEIGHT = 0.4;

  return quizStudentsList.value.map(student => {
    const studentId = student.id;
    
    // A. 抓取大考平均 (保持原樣)
    const examData = classRankings.value.find(r => String(r.student_id || r.id) === studentId);
    const examMastery = examData ? Number(examData.mastery) : null;

    // B. 抓取小考平均 (保持原樣，確保隨堂小考數字抓取邏輯不變)
    let quizTotal = 0;
    let quizCount = 0;
    Object.values(quizScoresMap.value).forEach(session => {
      if (session[studentId] !== undefined) {
        quizTotal += Number(session[studentId]);
        quizCount++;
      }
    });
    const quizAverage = quizCount > 0 ? quizTotal / quizCount : null;

    // C. 計算加權總分 (修正邏輯：有雙邊數據時按比例，單邊時採計單邊)
    let finalMastery = 0;
    if (examMastery !== null && quizAverage !== null) {
      finalMastery = Math.round((examMastery * EXAM_WEIGHT) + (quizAverage * QUIZ_WEIGHT));
    } else {
      // 保持你原本的後備方案，確保沒考小考的人不會變 0 分
      finalMastery = examMastery || Math.round(quizAverage) || 0;
    }

    return {
      name: student.name,
      id: studentId,
      examMastery,
      quizAverage: quizAverage ? Math.round(quizAverage) : null,
      combinedMastery: finalMastery
    };
  });
});


// ✅ 正確寫法（加上 async）
onMounted(async () => {
  loading.value = true;
  console.log("loading.value=",loading.value);
  // 必須先拿名單，再拿成績
  await refreshStats(); 
  await fetchQuizData();
  loading.value = false;
});

// ✨ 新增：監聽科目切換
watch(selectedSubject, () => {
  // 當科目切換時，重置細節過濾器並重新執行統計
  filters.date = '';
  filters.category = '';
  refreshStats();
});
</script>