<template>
  <div class="max-w-4xl mx-auto animate-in fade-in duration-700">

    <transition name="fade">
      <div v-if="loading || isSaving || isAnalyzing || isDeleting" class="global-loader-overlay">
        <div class="loader-spinner"></div>
        <div class="loader-text font-mono tracking-[0.3em] uppercase text-blue-600/60">
          {{ uploadStatus || '正在翻閱學習日誌...' }}
        </div>
      </div>
    </transition>

    <header class="mb-12">
      <p class="text-[10px] tracking-[0.4em] text-[#888888] uppercase mb-4 font-medium">Class Archive</p>
      <h1 class="text-3xl font-normal tracking-tight text-[#111111]">
        學習日誌
      </h1>
    </header>

    <div class="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
      <button v-for="(config, subject) in subjectConfigs" :key="subject"
        @click="selectedSubject = subject"
        :class="[
          'px-6 py-2 rounded-full text-[10px] tracking-[0.2em] font-bold uppercase transition-all whitespace-nowrap',
          selectedSubject === subject 
            ? 'bg-[#333333] text-white shadow-lg' 
            : 'bg-white text-[#888888] border border-[#EEEBE5] hover:border-[#333333]'
        ]">
        {{ subject }}
      </button>
    </div>

    <div class="space-y-12">
      <button @click="isEditorOpen = true"
              class="w-full py-8 border-2 border-dashed border-[#EEEBE5] rounded-[2rem] text-[#AAAAAA] hover:text-[#333333] hover:border-[#333333] transition-all group">
        <span class="text-xl group-hover:scale-110 inline-block transition-transform">＋</span>
        <p class="text-[10px] tracking-widest uppercase mt-2 font-bold">
          新增我的學習日誌
        </p>
      </button>
      <div v-for="(session, index) in filteredSessions" :key="index" 
      class="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all relative mb-6"
      :class="session.studentId ? 'border-amber-200 bg-amber-50/5' : 'border-[#EEEBE5]'">
      
      <div class="p-8 lg:p-12">
        <div class="flex justify-between items-start mb-8">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] tracking-widest text-blue-500 font-bold uppercase">
                {{ session.date }}
              </span>
              <span class="px-4 py-1 bg-[#F9F8F4] rounded-full text-[10px] font-bold tracking-widest text-[#888888] uppercase">
                {{ session.category }}
              </span>
            </div>
            <h2 
              contenteditable="true"
              @blur="onFieldBlur($event, session, 'topic')"
              @keydown.enter.prevent="$event.target.blur()"
              class="text-xl font-medium text-[#111111] outline-none border-b border-transparent hover:border-slate-200 focus:border-blue-500 transition-all cursor-text"
            >
              {{ session.topic }}
            </h2>
          </div>           
          <button 
            v-if="session.studentId === userConfig.student_id"
            @click="confirmDelete(session)"
            class="p-2 text-gray-300 hover:text-rose-500 transition-colors"
            title="刪除此紀錄"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div class="space-y-6 mb-10">
          <div class="flex items-center gap-3">
            <h3 class="text-[10px] tracking-[0.2em] text-[#AAAAAA] uppercase font-black">課堂重點</h3>
            <div class="h-px flex-1 bg-[#EEEBE5]"></div>
          </div>
          
          <ul class="text-sm text-[#555555] leading-loose list-disc pl-5 space-y-1">
            <li v-for="(point, pIdx) in session.points" :key="pIdx" class="marker:text-blue-500 group/item relative">
              <span 
                contenteditable="true"
                @blur="onPointBlur($event, session, pIdx)"
                @keydown.enter.prevent="$event.target.blur()"
                class="outline-none border-b border-transparent hover:border-slate-100 focus:text-blue-600 focus:border-blue-200 transition-all block cursor-text"
              >
                {{ point }}
              </span>
            </li>
          </ul>
        </div>

        <div :class="[
          'p-8 lg:p-10 rounded-[2.5rem] border transition-all',
          'bg-amber-50/50 border-amber-100 shadow-inner' 
        ]">
          <div class="flex flex-col xl:flex-row items-center justify-between gap-8">
            
            <div class="flex flex-col items-center xl:items-start flex-1 min-w-0">
              <div class="flex flex-wrap items-center justify-center xl:justify-start gap-3 mb-5">
                <span class="text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-wider bg-white shadow-sm"
                  :class="session.quizMode === 'concept' ? 'text-blue-600 border border-blue-100' : 'text-emerald-600 border border-emerald-100'">
                  {{ session.quizMode === 'concept' ? '觀念進階' : '熟記基礎' }}
                </span>
              </div>

              <h4 class="text-lg font-bold text-gray-800 leading-tight mb-4 text-center xl:text-left truncate w-full">
                {{ session.quizTitle }}
              </h4>

              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="text-amber-500 text-base leading-none">●</span> 
                  <span class="text-sm font-bold text-[#777777]">{{ session.totalQuestions }} 題目</span>
                </div>

                <div class="flex items-center gap-2">
                  <span :class="sessionIterations[session.sessionId] ? 'text-blue-500' : 'text-slate-300'" class="text-base leading-none">●</span> 
                  <span v-if="sessionIterations[session.sessionId]" class="text-sm font-bold text-[#777777]">
                    累計測驗 {{ sessionIterations[session.sessionId] }} 次
                  </span>
                  <span v-else class="text-sm font-bold text-slate-400 italic">
                    尚未開始挑戰
                  </span>
                </div>
              </div>
            </div>

          <div class="flex flex-col md:flex-row items-center gap-6 w-full xl:w-auto">
            
            <div v-if="completedTopics.has(session.sessionId)" class="text-center md:text-right px-6 md:border-r border-amber-200/50 h-12 flex flex-col justify-center">
              <p class="text-[10px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Score</p>
              <div class="text-3xl font-black text-gray-800 tracking-tighter">
                {{ quizScores[session.sessionId] ?? '--' }}<span class="text-xs ml-0.5 text-gray-400">pts</span>
              </div>
            </div>

            <div class="flex items-center gap-3">
              
              <div class="relative">
                <button v-if="completedTopics.has(session.sessionId)"
                @click="session.showSettings = !session.showSettings"
                :class="[
                  /* 基礎樣式完全不動 */
                  'group flex items-center justify-center gap-2 h-[60px] px-5 rounded-[20px] transition-all duration-300 border',
                  'hover:-translate-y-1 hover:shadow-lg active:scale-95',
                  
                  /* 只修改顏色邏輯：拿掉藍色，改為與面板統一的暖色調 */
                  completedTopics.has(session.sessionId)
                    ? 'bg-amber-100 text-amber-700 border-amber-300 shadow-inner' 
                    : 'bg-white text-slate-400 border-slate-200 hover:border-amber-200 hover:text-amber-600 shadow-sm'
                ]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" 
                  class="w-5 h-5 transition-transform duration-700" 
                  :class="session.showSettings ? 'rotate-180' : 'group-hover:rotate-180'"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span class="text-[11px] font-black uppercase tracking-widest" group-hover:translate-x-1>重新命題</span>
              </button>

                <div v-if="session.showSettings" class="absolute bottom-full mb-6 right-0 w-72 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 z-50 animate-in fade-in zoom-in duration-200">
                  <button @click="session.showSettings = false" class="absolute top-6 right-6 text-slate-300 hover:text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <h5 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">出題偏好設定</h5>
                  
                  <div class="space-y-6 mb-8">
                    <div>
                      <p class="text-[11px] font-bold mb-3 text-slate-700">挑戰難度</p>
                      <div class="grid grid-cols-2 gap-2">
                        <button @click="session.newDiff = 'memorize'" :class="session.newDiff === 'memorize' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'" class="py-2.5 text-[10px] font-bold rounded-xl transition-all">熟記基礎</button>
                        <button @click="session.newDiff = 'concept'" :class="session.newDiff === 'concept' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'" class="py-2.5 text-[10px] font-bold rounded-xl transition-all">觀念進階</button>
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between items-end mb-3">
                        <p class="text-[11px] font-bold text-slate-700">題目數量</p>
                        <span class="text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          {{ session.newCount || session.totalQuestions || 10 }} 題
                        </span>
                      </div>

                      <div class="bg-slate-50 rounded-xl px-4 py-4 border border-slate-100">
                        <input 
                          type="range" 
                          v-model.number="session.newCount" 
                          :min="3" 
                          :max="15" 
                          step="1"
                          class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        
                        <div class="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-1">
                          <span>最小 3 題</span>
                          <span>最大 15 題</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button @click="openQuiz(session, true); session.showSettings = false" class="w-full py-4 bg-amber-500 text-white text-[11px] font-black rounded-2xl hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                    <span>確認並刷新題目</span>
                    <span class="text-sm">⚡</span>
                  </button>
                </div>
              </div>

                <button @click="openQuiz(session)"
                  :class="[
                    /* 基礎樣式：與重新命題完全對齊 */
                    'group flex items-center justify-center gap-4 h-[60px] px-10 rounded-[20px] text-xs font-black uppercase tracking-[0.3em] transition-all duration-300 border ease-out',
                    'hover:-translate-y-1 hover:shadow-lg active:scale-95 cursor-pointer whitespace-nowrap',
                    
                    /* 修改後的顏色行為：與重新命題同步 */
                    completedTopics.has(session.sessionId)
                      ? 'bg-amber-100 text-amber-700 border-amber-300 shadow-inner' 
                      : 'bg-white text-slate-400 border-slate-200 hover:border-amber-200 hover:text-amber-600 shadow-sm'
                  ]"
                >
                  <span>
                    {{ completedTopics.has(session.sessionId) ? '再次挑戰' : '開始測驗' }}
                  </span>
                  
                  <span class="text-xl transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </button>
            </div>


            <div class="md:border-l md:pl-6 border-amber-200/50">
              <div class="text-[8px] font-black tracking-widest uppercase text-slate-300">
                {{ isSyncing ? 'Synced' : 'Cloud' }}
              </div>
            </div>
         </div> 
       </div>
     </div> 
  </div> 
</div>
</div>


    <div v-if="isEditorOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/20 backdrop-blur-md">
      <div class="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 lg:p-14 overflow-y-auto max-h-[90vh]">
      <div class="flex justify-between items-center mb-10">
        <h2 class="text-2xl font-normal tracking-tight">今日課堂紀錄</h2>
        <button @click="isEditorOpen = false" class="text-gray-400 hover:text-black">✕</button>
      </div>
      <div class="mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] flex items-center justify-between group overflow-hidden relative">
          <div v-if="isAnalyzing" class="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-[10px] font-bold text-blue-600 tracking-widest uppercase">AI 正在分析圖片中...</span>
              </div>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-black text-blue-600 tracking-widest uppercase mb-1">AI 智慧小幫手</span>
              <p class="text-[11px] text-blue-500/70">拍攝筆記或課本，自動整理重點</p>
            </div>
            <button @click="triggerCamera" class="bg-blue-600 text-white p-4 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-90">
              <span class="text-xl">📸</span>
            </button>
            <input type="file" ref="cameraInput" accept="image/*" multiple class="hidden"  @change="handlePhotoUpload" />
          </div>

          <div class="space-y-8">
            <div>
              <label class="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest block mb-3">課堂主題</label>
              <input v-model="newSession.topic" type="text" placeholder="輸入課程標題..." class="w-full p-4 bg-[#F9F9F7] rounded-2xl border-none outline-none text-sm" />
            </div>
            <div>
              <label class="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest block mb-3">課堂內容 (換行分隔)</label>
              <textarea v-model="newSession.pointsRaw" rows="4" placeholder="輸入今天的重點項目..." class="w-full p-4 bg-[#F9F9F7] rounded-2xl border-none outline-none text-sm leading-relaxed"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest block mb-3">分類</label>
                <select v-model="newSession.category" class="w-full p-4 bg-[#F9F9F7] rounded-2xl border-none outline-none text-sm">
                  <option v-for="cat in (subjectConfigs[selectedSubject]?.cats || [])" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>
            <div>
            <label class="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest block mb-3">測驗模式</label>
            <select v-model="newSession.quizMode" class="w-full p-4 bg-[#F9F9F7] rounded-2xl border-none outline-none text-sm cursor-pointer">
              <option value="concept">💡 觀念挑戰</option>
              <option value="memorize">🧠 熟背模式</option>
            </select>
          </div>
        </div>
        <div class="p-4 bg-gray-50 rounded-xl mb-4 border border-gray-200">
          <div class="flex justify-between items-center mb-3">
            <span class="text-gray-700 font-bold">測驗題數</span>
            <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-black">
              {{ newSession.quizCount }} 題
            </span>
          </div>

          <input 
            type="range" 
            v-model.number="newSession.quizCount" 
            min="3" 
            max="15" 
            step="1"
            class="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
  
          <div class="flex justify-between text-xs text-gray-400 mt-2 px-1">
            <span>最少 3 題</span>
            <span>最多 15 題</span>
          </div>
        </div>

        <button @click="saveNewSession" :disabled="isSaving" 
          class="w-full py-5 bg-[#333333] text-white rounded-2xl text-[10px] tracking-[0.4em] font-bold uppercase hover:bg-black disabled:bg-gray-300 transition-all shadow-xl shadow-gray-200">
          {{ isSaving ? 'SAVING TO CLOUD...' : '確認發佈並同步至 SHEET' }}
        </button>
      </div>
    </div>
  </div>
  
<div v-if="activeQuiz" class="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md">
  
  <div class="bg-white w-full max-w-4xl max-h-[95vh] sm:rounded-[4rem] rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col">
    <button @click="activeQuiz = null" 
      class="absolute top-6 right-8 z-[60] p-3 text-gray-300 hover:text-rose-500 transition-all hover:scale-110"
      title="退出測驗">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <div class="p-10 lg:p-14">
      <div class="flex justify-between items-center mb-8">
        <div class="flex items-center gap-3">
          <span class="bg-blue-600 text-white text-sm font-black px-3 py-1.5 rounded-xl shadow-sm">
            第 {{ currentIdx + 1 }} 題
          </span>
          <span class="text-sm font-bold text-slate-400">
            共 {{ totalQuestions }} 題
          </span>
        </div>
        
        <div class="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-blue-600 transition-all duration-300" 
               :style="{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }">
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-slate-800 leading-relaxed mb-10">
        {{ currentQuestion.q }}
      </h2>

      <div class="grid grid-cols-1 gap-5">
  <button v-for="(opt, oIdx) in currentQuestion.options" :key="oIdx"
    @click="handleAnswer(opt)"
    class="group w-full p-6 rounded-2xl border-2 border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all text-left flex items-center gap-5 shadow-sm hover:shadow-md hover:translate-x-2"
  >
    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-lg font-black text-slate-400 transition-colors">
      {{ String.fromCharCode(65 + oIdx) }}
    </div>

    <div class="text-lg font-medium text-slate-700">
      {{ opt }}
    </div>
  </button>
</div>
    </div>

    <Transition name="fade-in-scale">
      <div v-if="showFeedback" class="absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-xl bg-white/60">
        <div class="relative mb-8">
          <div class="absolute inset-0 blur-3xl opacity-30 animate-pulse"
               :class="lastAnswerStatus === 'correct' ? 'bg-emerald-400' : 'bg-rose-400'">
          </div>
          <div class="relative flex items-center justify-center w-32 h-32 rounded-full shadow-2xl transition-all duration-500"
               :class="lastAnswerStatus === 'correct' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'">
            <svg v-if="lastAnswerStatus === 'correct'" class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <div class="text-center">
          <p class="text-4xl font-black" :class="lastAnswerStatus === 'correct' ? 'text-emerald-600' : 'text-rose-600'">
            {{ lastAnswerStatus === 'correct' ? '答對了！' : '再接再厲' }}
          </p>
        </div>
      </div>
    </Transition>
  </div>
</div>

<Transition name="modal">
  <div v-if="deleteModal.show" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="deleteModal.show = false"></div>
    <div class="relative bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-10 transform transition-all border border-slate-100">
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-50 mb-6">
          <span class="text-3xl">🗑️</span>
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-3">確認刪除紀錄？</h3>
        <p class="text-base text-slate-500 mb-8 leading-relaxed">
          確定要刪除「<span class="text-rose-600 font-bold">{{ deleteModal.session?.topic }}</span>」嗎？此操作無法還原。
        </p>
      </div>
      <div class="flex space-x-4">
        <button @click="deleteModal.show = false" class="flex-1 px-6 py-3.5 rounded-2xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold transition-all">取消</button>
        <button @click="executeDelete" class="flex-1 px-6 py-3.5 rounded-2xl text-white bg-rose-500 hover:bg-rose-600 font-bold shadow-lg shadow-rose-200 transition-all">確定刪除</button>
      </div>
    </div>
  </div>
</Transition>
<transition name="notification">
  <div v-if="alertConfig.show" class="fixed top-8 left-1/2 -translate-x-1/2 z-[400] w-[90%] max-w-md pointer-events-none">
    <div class="bg-white/80 backdrop-blur-xl border p-5 rounded-[28px] shadow-2xl flex items-start gap-4" 
         :class="{'border-emerald-100': alertConfig.type === 'success', 'border-rose-100': alertConfig.type === 'error'}">
      
      <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-xl bg-gray-50">
        {{ alertConfig.type === 'success' ? '✅' : '❌' }}
      </div>
      
      <div class="flex-1">
        <h4 class="text-sm font-black text-gray-800 tracking-wider">{{ alertConfig.title }}</h4>
        <p class="text-xs text-gray-500 mt-1">{{ alertConfig.message }}</p>
      </div>

    </div>
  </div>
</transition>

</div> </template>

<script setup>
import { inject, ref, computed, onMounted, watch } from 'vue';
import { useAuth } from '~/composables/useAuth'
const loading = ref(false);
const subjectConfigs = inject('subjectConfigs'); // ✨ 補上這行，從 app.vue 注入配置
const userConfig = inject('userConfig'); 
const completedTopics = ref(new Set());
const showToast = inject('showToast'); 
const allStudentsList = ref([]); 
const sessions = ref([]);
const isEditorOpen = ref(false);
const isSaving = ref(false);
const sessionIterations = ref({});
const activeQuiz = ref(null);
const currentIdx = ref(0);
const quizResults = ref([]); 
const localRefreshTracker = ref({});// 用來紀錄「本次開啟網頁後」額外新增的次數
const uploadStatus = ref('正在翻閱學習日誌...'); // 預設進入文字
const isDeleting = ref(false); // 新增刪除狀態，用於觸發全域遮罩
const cameraInput = ref(null);
const isAnalyzing = ref(false);
const isSyncing = ref(false);
const { getValidConfig } = useAuth();

const newSession = ref({
  topic: '',
  pointsRaw: '',
  category: '', // 先留空，由 watch 處理
  quizMode: 'concept', // 預設值建議改為 concept，對應妳 HTML 的 <option value="concept">
  quizCount: 10 // 👈 預設為 10 題
});

//觸發隱藏的 input click
const triggerCamera = () => {
  if (cameraInput.value) cameraInput.value.click();
};

//1. 處理照片並送往 AI
const handlePhotoUpload = async (event) => {
  // 1.🛡️ 門禁守衛：直接取得驗證過的設定
  const auth = getValidConfig();
  if (!auth) {
    event.target.value = ''; // 沒卡就清空選擇，防止卡死
    return;
  }

  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  // 2. 通過檢查，直接從 auth 拿到所有設定（不需要再從 localStorage 慢慢抓）
  const userConfig = auth; 

  isAnalyzing.value = true;
  uploadStatus.value = 'AI 正在解析筆記內容...';

  try {
    // --- ✨ 壓縮圖片的 Promise 工具 ---
    const compressImage = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 1200;
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            resolve(compressedBase64.split(',')[1]); 
          };
          img.onerror = reject;
        };
        reader.onerror = reject;
      });
    };

    // 執行壓縮
    const imagesArray = await Promise.all(files.map(file => compressImage(file)));

    // 3. 送往 API (body 裡的 userConfig 直接用剛才門禁拿到的 auth)
    const response = await $fetch('/api/sessions', {
      method: 'POST',
      body: {
        action: 'analyzeVision',
        userConfig: auth, // 👈 直接把完整的 auth 送過去，裡面包含 key 和 sheetId
        subjectConfigs: subjectConfigs, 
        sessionData: {
          category: newSession.value.category 
        },
        imagesArray: imagesArray
      }
    });

    if (response.success) {
      if (response.data.category) {
        const aiCategory = response.data.category.trim().replace(/[。\.]$/, '');
        let found = false;
        for (const mainCat in subjectConfigs) {
          if (subjectConfigs[mainCat].cats.includes(aiCategory)) {
            newSession.value.category = aiCategory;
            found = true;
            break;
          }
        }
        if (!found) {
          newSession.value.category = aiCategory;
        }
      }
      
      newSession.value.topic = response.data.topic;
      newSession.value.pointsRaw = response.data.points.join('\n');
      
      if (showToast) showToast(`✨ AI 判定為：${newSession.value.category}`);
    } else {
      throw new Error(response.error);
    }
  } catch (e) {
    console.error("辨識失敗:", e);
    // 如果還是 413，給予具體提示
    const errorMsg = e.response?.status === 413 ? "圖片檔案過大，請嘗試減少張數或縮小照片" : (e.message || "請檢查網路");
    showAlert('辨識失敗', errorMsg, 'error');
    
  } finally {
    isAnalyzing.value = false;
    event.target.value = ''; 
    uploadStatus.value = ''; // 清空
  }
};

const totalQuestions = computed(() => activeQuiz.value?.questions?.length || 0);
const currentQuestion = computed(() => activeQuiz.value?.questions[currentIdx.value] || {});
const quizProgress = computed(() => (totalQuestions.value > 0 ? (currentIdx.value / totalQuestions.value) * 100 : 0));
const quizScores = ref({}); 

// --- 功能：抓取 Google Sheets 資料 (增強版：增加 F5 自我修復) ---
const fetchSessions = async () => {
  // 1. 💡 改用門禁工具，確保資料來源統一且安全
  const { getValidConfig } = useAuth();
  const config = getValidConfig();

  // 如果門禁沒過（資料缺失），getValidConfig 會跳彈窗並回傳 null
  if (!config) {
    loading.value = false;
    return;
  }

  // 2. 💡 統一變數名稱，對接門禁清單中的 key
  const targetSheetId = config.sheet_id;
  const currentStudentId = config.student_id;
  const currentRole = config.role;

  // 3. 安全檢查
  if (!targetSheetId || targetSheetId === 'undefined') {
    loading.value = false;
    return;
  }

  const gasUrl = localStorage.getItem('user_gas_url'); // 💡 取得 GAS 網址

  loading.value = true;

  try {
    // 💡 替代原本的 $fetch，改由 GAS 抓取資料以避開 Vercel 的 400 錯誤
    const fetchFromGAS = async (sheetName) => {
      if (!gasUrl) throw new Error("缺少 GAS URL 設定");
      const response = await fetch(gasUrl, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'fetch_data', 
          sheetName: sheetName 
        })
      });
      const res = await response.json();
      return res.success ? res.data : [];
    };

    // 4. ✨ 核心修改點：將 $fetch 換成 fetchFromGAS，但保留對應的變數名稱
    const [sessionResponse, resultsResponse] = await Promise.all([
      fetchFromGAS('Sessions'),
      fetchFromGAS('QuizResults')
    ]);

    // 保持原本的解構邏輯，確保相容性
    const rawRows = Array.isArray(sessionResponse) ? sessionResponse : (sessionResponse.data || []);
    const rawResults = Array.isArray(resultsResponse) ? resultsResponse : (resultsResponse.data || []);

    // --- 1. 回數統一計算邏輯 (維持原設計) ---
    const sessionIterationMap = {};
    rawResults.forEach(res => {
      const sid = String(res.sessionId || res.SessionID || '').trim();
      if (!sid || sid === 'undefined') return;
      sessionIterationMap[sid] = (sessionIterationMap[sid] || 0) + 1;
    });

    sessionIterations.value = sessionIterationMap;
    console.log('單一測驗次數對照表:', sessionIterationMap);

    // --- 2. 過濾邏輯 (維持原設計) ---
    const myId = (currentStudentId || '').trim().toLowerCase();
    const processedRows = rawRows.filter(s => {
      const rowSid = String(s.studentId || s.student_id || s.StudentId || '').trim().toLowerCase();
      return rowSid === myId;
    });

    // --- 3. 成績處理 (維持原設計) ---
    const completedSet = new Set();
    const scoresMap = {};
    rawResults.forEach(res => {
      const sid = res.sessionId || res.SessionID;
      if (sid) {
        const scoreVal = res.Score !== undefined ? res.Score : res.score;
        completedSet.add(sid);
        if (scoreVal !== null) scoresMap[sid] = scoreVal;
      }
    });
    completedTopics.value = completedSet;
    quizScores.value = scoresMap;

    // --- 4. 資料轉化 (維持原設計，包含題數判斷) ---
    if (processedRows.length >= 0) {
      sessions.value = processedRows.map(s => {
        const student_id_val = s.studentId || s.student_id || '';
        
        const rawPoints = s.Points || '';
        let parsedPoints = [];
        try {
          if (typeof rawPoints === 'string' && rawPoints.startsWith('[')) {
            parsedPoints = JSON.parse(rawPoints);
          } else if (rawPoints) {
            parsedPoints = String(rawPoints).split('\n').filter(p => p.trim());
          }
        } catch (e) { parsedPoints = [rawPoints]; }

        let rawCount = s.totalQuestions || s.TotalQuestions || s['totalQuestions'];
        let finalCount = 10; 

        let actualQuizLength = 0;
        try {
          const qData = s.QuizJSON || s.QuizContent;
          if (qData) {
            const parsedQuiz = typeof qData === 'string' ? JSON.parse(qData) : qData;
            if (Array.isArray(parsedQuiz)) {
              actualQuizLength = parsedQuiz.length;
            }
          }
        } catch (e) { actualQuizLength = 0; }

        if (rawCount !== undefined && rawCount !== "" && rawCount !== null) {
          finalCount = parseInt(rawCount);
        } else if (actualQuizLength > 0) {
          finalCount = actualQuizLength;
        }

        return {
          sessionId: s.sessionId || s.SessionID || '',
          date: s.Date || '',
          topic: s.Topic || '',
          category: s.Category || s.category || '',
          quizTitle: s.QuizTitle || '隨堂小挑戰',
          quizMode: s.QuizMode || '',
          points: parsedPoints, 
          QuizJSON: s.QuizJSON || s.QuizContent || '',
          totalQuestions: finalCount,
          userName: s.UserName || '',
          studentId: String(student_id_val).toLowerCase().trim()
        };
      }).reverse();
    }
  } catch (e) {
    console.error("[Fetch] 載入失敗:", e);
  } finally {
    loading.value = false;
  }

  // 確保此函式存在才呼叫
  if (typeof updateFilteredData === 'function') {
    updateFilteredData();
  }
};

// --- 功能：開啟測驗 ---
const openQuiz = async (session, isRefresh = false) => {
  try {
    // 1. 💡 AI 刷新邏輯區塊
    if (isRefresh || !session.QuizJSON || String(session.QuizJSON).trim() === "" || String(session.QuizJSON) === "undefined") {
      
      if (!isRefresh && (!session.QuizJSON || String(session.QuizJSON).trim() === "")) {
        showAlert('尚未準備測驗', '這堂課還沒有準備測驗題目喔！', 'info');
        return;
      }

      if (showToast) showToast("AI 正在重新命題並儲存中...");
      isAnalyzing.value = true;
      uploadStatus.value = '正在根據筆記重新命題...';
      
      try {
        const response = await $fetch('/api/sessions', {
          method: 'POST',
          body: {
            action: 'refreshQuiz',
            userConfig: { 
              gemini_key: userConfig.gemini_key || JSON.parse(localStorage.getItem('allegro_config') || '{}').gemini_key, 
              sheet_id: userConfig.sheet_id,
              student_id: userConfig.student_id,
              userName: userConfig.userName
            },
            sessionData: {
              sessionId: session.sessionId,
              date: session.date, 
              topic: session.topic,
              category: session.category,
              quizMode: session.newDiff || session.quizMode || 'concept',
              points: Array.isArray(session.points) ? session.points : [session.points],
              questionCount: session.newCount || 10
            }
          }
        });

       if (response.success && response.quizGenerated) {
      const newQuizJSON = typeof response.quizGenerated === 'string' 
        ? response.quizGenerated 
        : JSON.stringify(response.quizGenerated);

      // 2. ✨ 重點：出完題立刻叫 GAS 存回試算表
      const gasUrl = localStorage.getItem('user_gas_url');
      if (gasUrl) {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            action: 'update_session', // 我們剛剛寫好的更新功能
            sessionId: session.sessionId,
            updates: {
              quizJSON: newQuizJSON, // 假設你在 GAS 有對應這個欄位
              quizMode: session.newDiff || session.quizMode
            }
          })
        });
      }

      session.QuizJSON = newQuizJSON;
      } else {
          throw new Error("AI 未能回傳有效題目");
        }
      } catch (e) {
        console.error("刷新題目失敗:", e);
        showAlert('重新出題失敗', '請檢查網路連線或 API 設定是否正確', 'error');
        return; // 只有發生錯誤才中斷
      } finally {
        isAnalyzing.value = false;
      }
    }

    // --- ⬇️ 2. 解析與載入邏輯 (這是原本代碼的下半部) ⬇️ ---
    let rawData = session.QuizJSON;
    console.log("rawData=", rawData);

    let parsedData = rawData;
    if (typeof rawData === 'string') {
      try {
        parsedData = JSON.parse(rawData.trim());
        // 處理雙重 JSON 轉義
        if (typeof parsedData === 'string') {
          parsedData = JSON.parse(parsedData.trim());
        }
      } catch (e) {
        console.error("JSON 解析失敗:", rawData);
        showAlert('格式錯誤', '測驗格式損壞，請檢查試算表欄位內容。', 'error');
        return;
      }
    }

    let questionsArray = [];
    if (Array.isArray(parsedData)) {
      questionsArray = parsedData.map(q => ({
        q: q.q || q.question || "",
        options: q.options || [],
        a: q.a || (q.options && q.options[q.correct]) || "",
        explanation: q.explanation || "AI 自動生成題目"
      }));
    } else if (typeof parsedData === 'object' && parsedData !== null) {
      questionsArray = [{
        q: parsedData.question || parsedData.q || "",
        options: parsedData.options || [],
        a: parsedData.a || (parsedData.options && parsedData.options[parsedData.correct]) || "",
        explanation: parsedData.explanation || ""
      }];
    }

    // 💡 修正點：確保 activeQuiz 確實被賦予處理後的陣列
    activeQuiz.value = {
      sessionId: session.sessionId,
      topic: session.topic || "隨堂測驗",
      category: session.category, 
      questions: questionsArray
    };
    
    currentIdx.value = 0;
    quizResults.value = [];
    console.log("[Quiz] 成功載入題目數:", questionsArray.length);

  } catch (err) {
    console.error("Quiz 系統崩潰:", err);
    showAlert('解析錯誤', '系統解析題目時發生錯誤', 'error');
  }
};

// --- 新增狀態控制 ---
const isProcessing = ref(false);    // 防止重複點擊
const showFeedback = ref(false);    // 控制回饋遮罩
const lastAnswerStatus = ref(null); // 紀錄當前答題對錯

// --- 功能：處理答題 ---
const handleAnswer = async (selected) => {
  if (isProcessing.value) return; 
  
  isProcessing.value = true;
  
  const qData = currentQuestion.value; 
  const correctText = qData.a; 
  const isCorrect = selected === correctText;
  
  quizResults.value.push({
    question: qData.q,
    options: qData.options,
    selected: selected,
    correct: correctText,
    isCorrect: isCorrect,
    explanation: qData.explanation || "" 
  });
  
  lastAnswerStatus.value = isCorrect ? 'correct' : 'incorrect';
  showFeedback.value = true;

  setTimeout(async () => {
  showFeedback.value = false;
  
  if (currentIdx.value + 1 < totalQuestions.value) {
    currentIdx.value++;
    isProcessing.value = false; 
  } else {
    // 🛡️ 確保此時 activeQuiz 還在才執行快照
    if (!activeQuiz.value) return;
    const quizSnapshot = { ...activeQuiz.value };

    try {
      if (showToast) showToast('正在儲存成績與記錄...');
      
      await Promise.all([
        finishAndSubmitQuiz(quizSnapshot), 
        saveQuizResult(quizSnapshot)       
      ]);

      if (showToast) showToast('✅ 紀錄已成功同步');
    } catch (err) {
      console.error("存檔過程發生錯誤:", err);
    } finally {
      // ✨ 重點：先重置索引，最後才把 activeQuiz 設為 null
      // 這樣可以避免 Vue 在切換畫面時，currentQuestion 還在讀取不存在的索引
      isProcessing.value = false;
      showFeedback.value = false;
      
      // 🚀 關鍵操作：先讓索引歸零，再讓測驗物件消失
      currentIdx.value = 0; 
      activeQuiz.value = null; 
      
      quizResults.value = []; 
    }
  }
}, 1200);
};
// --- 功能：完成並上傳成績 ---
// 傳入 snapshot 作為參數
const finishAndSubmitQuiz = async (snapshot) => {
  const quizData = snapshot || activeQuiz.value;
  if (!quizData) return;

  const gasUrl = localStorage.getItem('user_gas_url');
  if (!gasUrl) return;

  const correctCount = quizResults.value.filter(r => r.isCorrect).length;
  const quizTotal = quizData.questions?.length || 1;
  const finalScore = Math.round((correctCount / quizTotal) * 100);
  const isAllCorrect = finalScore === 100;
  
  if (showToast) showToast('測驗結束，正在同步成績...');

  try {
    // 💡 改為呼叫 GAS，欄位完全對齊你原本的 .js 檔案
    await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'submit_quiz',
        sessionId: quizData.sessionId,
        studentId: userConfig.student_id,
        studentName: userConfig.userName || 'Unknown',
        topic: quizData.topic,
        score: finalScore,
        isCorrect: isAllCorrect
      })
    });
    
    // 2. 刷新資料 (讓首頁次數更新)
    if (typeof fetchSessions === 'function') {
      await fetchSessions();
    }

    // 3. 更新本地狀態 (維持原本邏輯)
    completedTopics.value.add(quizData.sessionId);
    completedTopics.value = new Set(completedTopics.value); 
    quizScores.value = { ...quizScores.value, [quizData.sessionId]: finalScore };

    // --- localStorage 儲存 ---
    const localKey = `completed_${userConfig.student_id}`;
    const localScoreKey = `scores_${userConfig.student_id}`;
    const savedSids = JSON.parse(localStorage.getItem(localKey) || '[]');
    if (!savedSids.includes(quizData.sessionId)) {
      savedSids.push(quizData.sessionId);
      localStorage.setItem(localKey, JSON.stringify(savedSids));
    }
    const savedScores = JSON.parse(localStorage.getItem(localScoreKey) || '{}');
    savedScores[quizData.sessionId] = finalScore;
    localStorage.setItem(localScoreKey, JSON.stringify(savedScores));
    
    if (showToast) showToast(`🎉 挑戰完成！最終得分：${finalScore}`);
  } catch (e) {
    console.error("成績同步失敗", e);
    if (showToast) showToast('成績上傳失敗，請檢查網路。');
  }
};

const saveNewSession = async () => {
  const auth = getValidConfig(); 
  if (!auth) return; 
  
  if (!newSession.value.topic?.trim() || !newSession.value.pointsRaw?.trim()) {
    showAlert('內容不完整', '標題與內容都是必填的喔！', 'error');
    return;
  }

  isSaving.value = true;
  isAnalyzing.value = true; 
  uploadStatus.value = '正在處理 AI 命題與同步...';
  
  try {
    // 1. 🚀 先叫 Vercel 後端幫忙出題 (純 AI 運算)
    const response = await $fetch('/api/sessions', {
      method: 'POST',
      body: {
        action: 'generateQuizOnly', // 💡 改用純 AI 模式
        userConfig: { gemini_key: auth.gemini_key },
        sessionData: {
          topic: newSession.value.topic,
          points: newSession.value.pointsRaw.split('\n').filter(p => p.trim()),
          quizMode: newSession.value.quizMode,
          quizCount: newSession.value.quizCount || 10
        }
      }
    });

if (response.success) {
  const newSid = 'SID-' + Date.now();
      const pointsArray = newSession.value.pointsRaw.split('\n').filter(p => p.trim());
      
      // 2. 💡 關鍵：直接呼叫 GAS 存入 Google Sheets
      // 我們不經過 Vercel，直接把資料丟進 GAS
      const gasUrl = localStorage.getItem('user_gas_url'); 
      if (!gasUrl) throw new Error("找不到 GAS 連結，請先前往設定頁面配置");

    const payload = {
      action: 'append_session',
      sheetName: 'Sessions',
      data: {
        sessionId: newSid,
        date: new Date().toLocaleDateString('en-CA'),
        topic: newSession.value.topic,
        category: newSession.value.category,
        points: JSON.stringify(pointsArray), // E 欄
        quizTitle: '隨堂挑戰',                // F 欄
        quizMode: newSession.value.quizMode, // G 欄
        quizJSON: JSON.stringify(response.quizGenerated), // H 欄
        studentId: auth.student_id           // I 欄
      }
    };

      // 使用 no-cors 模式發送給 Google
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
      });

      // 💡 關鍵優化：給 Google Sheets 一點點時間 (例如 800ms) 處理寫入
      // 否則接下來的 fetchSessions() 可能會抓不到最新那筆
      await new Promise(resolve => setTimeout(resolve, 800));

      // 1. ✨ 先執行刷新
      await fetchSessions();
      
      // 2. ✨ 從刷新後的列表中找出剛才那筆
      // 這裡直接比對我們剛生成的 newSid
      const latestSessionFromSheet = sessions.value.find(s => s.sessionId === newSid);
      const finalSessionId = latestSessionFromSheet?.sessionId || newSid;
      
      // 3. 處理題目數據 (維持原本邏輯)
      let rawQuestions = response.quizGenerated || [];
      const questionsArray = (Array.isArray(rawQuestions) ? rawQuestions : [rawQuestions]).map(q => ({
        q: q.q || q.question || "",
        options: q.options || [],
        a: q.a || (q.options && q.options[q.correct]) || "",
        explanation: q.explanation || ""
      }));

      // 4. 開啟測驗介面
      if (questionsArray.length > 0 && questionsArray[0].q !== "") {
        activeQuiz.value = {
          sessionId: finalSessionId, // ✨ 使用從列表同步後的正式 ID
          category: newSession.value.category,
          topic: newSession.value.topic,
          questions: questionsArray,
          date: new Date().toLocaleDateString('en-CA'), 
        };
        
        currentIdx.value = 0;
        quizResults.value = [];
        
        console.log("[Quiz] 發布成功並自動加載題目，ID:", finalSessionId);
      } else {
        console.warn("後端未回傳有效題目內容", response);
      }

      // 5. 顯示成功訊息
      const msg = "個人學習日誌已上傳！"; 
      if (showToast) showToast(msg);
      
      // 6. 關閉並重置編輯器
      isEditorOpen.value = false;
      const lastCategory = newSession.value.category;
      newSession.value = { 
        topic: '', 
        pointsRaw: '', 
        category: lastCategory, 
        quizMode: 'concept' // ✨ 重置回預設值
      };
    }else {
      // --- ✨ 修改處 3：API 回傳失敗 ---
      showAlert('發布失敗', response.error || '請檢查網路連線後重試', 'error');
    }
  } catch (e) {
    console.error("Fetch Error:", e);
    // --- ✨ 修改處 4：連線噴錯 ---
    showAlert('網路或系統錯誤', '目前無法連線至伺服器', 'error');
  } finally {
    isSaving.value = false;
    isAnalyzing.value = false; // 關閉全域遮罩
    uploadStatus.value = '';   // 清空文字
  }
};

// 在 <script setup> 中新增紀錄學生選了什麼的變數
const selectedAnswerIndex = ref(null);

// 修改 checkAnswer 讓它紀錄學生的選擇
// 在 <script setup> 內找個位置加上這行
const lastSelectedIndex = ref(null); 

const checkAnswer = async (idx) => {
  lastSelectedIndex.value = idx; // ✨ 新增：紀錄學生點選的 index
  isCorrect.value = idx === quizData.value.correct;
  isFinished.value = true;
  if (userConfig.role === 'student') await saveQuizResult();
};


// --- 功能：存入個人表單 ---
const saveQuizResult = async (snapshot) => {
  // 🛡️ 第一道門禁：身分驗證 (裝備檢查)
  const auth = getValidConfig(); 
  if (!auth) {
    console.error("[系統] 門禁缺失，無法自動存檔");
    return; // 這裡會自動跳出你設計的漂亮寶藍色彈窗
  }


  // 📦 第二道保險：資料檢查 (確認測驗內容還在)
  // 💡 這裡一定要留！解決傳入參數或全域變數 undefined 的問題
  const quizData = snapshot || activeQuiz.value;
  
  if (!quizData || !quizData.topic) {
    console.warn("[系統] 找不到測驗資料快照，取消存檔");
    return;
  }

  
  const gasUrl = localStorage.getItem('user_gas_url');
  if (!gasUrl) return;


  // ✨ 驗證通過，開始取值
  const targetSheetId = auth.sheet_id;
  const studentId = auth.student_id || auth.login_code;

  const currentTopic = quizData.topic;
  const currentCategory = quizData.category || '未分類';
  const modeLabel = quizData.quizMode === 'memorize' ? '🧠熟背' : '💡觀念';

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const scanTimestamp = now.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  const getLetter = (index) => String.fromCharCode(65 + index);

  const updates = quizResults.value.map((res, idx) => {
    let formattedOptions = "";
    if (res.options && res.options.length > 0) {
      formattedOptions = "\n" + res.options.map((opt, i) => `(${getLetter(i)})${opt}`).join(' ');
    }
    const fullQuestionDetail = `${res.question}${formattedOptions}`;

    const getAnswerLetter = (text) => {
      const foundIdx = res.options?.indexOf(text);
      return foundIdx !== -1 ? getLetter(foundIdx) : text;
    };

    return {
      id: `quiz-${Date.now()}-${idx}`,
      date: formattedDate,
      scan_date: scanTimestamp,
      category: currentCategory, 
      title: `${currentTopic} - (隨堂測驗)`, // 對應 E 欄
      question_key: `${currentTopic}(${modeLabel}) - 第 ${idx + 1} 題`, // 對應 F 欄
      correct_answer: getAnswerLetter(res.correct),
      user_answer: getAnswerLetter(res.selected),
      knowledge_point: fullQuestionDetail,
      image_url: '', // J 欄目前留空
      is_mastered: res.isCorrect ? 'TRUE' : 'FALSE',
      ai_explanation: res.explanation || '無解析'
    };
  });

  try {
    // 💡 捨棄 /api/assignments，直接找 GAS
    await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'append_batch',
        sheetName: auth.name, // 存到該學生的個人分頁
        data: updates
      })
    });
   console.log("✅ 測驗結果已透過 GAS 同步=", auth.name);
  } catch (e) {
    console.error("同步失敗:", e);
  }
};

// 1. 宣告目前選中的科目 (預設為樂理)
const selectedSubject = ref('國文');



const filteredSessions = ref([]);

// 建立一個更新資料的 function
const updateFilteredData = () => {
  if (!sessions.value) {
    filteredSessions.value = [];
    return;
  }
  
  const allowedCats = (subjectConfigs[selectedSubject.value]?.cats || [])
    .map(c => String(c).trim().toLowerCase());
  
  filteredSessions.value = sessions.value.filter(s => {
    const sessionCat = String(s.category || '').trim().toLowerCase();
    return allowedCats.includes(sessionCat);
  });
};

// 3. 監聽科目切換，自動更新新增表單的預設分類
watch(selectedSubject, async (newSub) => {
  // ✨ 新增這行：如果正在刪除或儲存中，就不要執行切換科目的 Loading 邏輯
  if (isDeleting.value || isSaving.value) return;

  // 1. 先清空目前的列表 (選擇性)，並立刻啟動轉圈圈
  uploadStatus.value = `正在調閱 ${newSub} 筆記...`;
  loading.value = true;

  // 2. 更新預設分類 (運算極快，不影響視覺)
  const cats = subjectConfigs[newSub]?.cats || [];
  if (cats.length > 0) {
    newSession.value.category = cats[0];
  }

  // 3. ✨ 關鍵延遲：給瀏覽器大約 50-100ms 的時間去渲染「轉圈圈」的畫面
  // 這樣使用者會先看到訊息，感覺系統在「準備中」
  await new Promise(resolve => setTimeout(resolve, 100));

  // 4. 正式更新資料 (這時候畫面已經被遮罩擋住了)
  updateFilteredData();

  // 5. 額外的小延遲 (讓轉圈圈不要閃現太快，保持質感)
  await new Promise(resolve => setTimeout(resolve, 400)); 

  loading.value = false;
}, { immediate: false }); // 初始掛載由 onMounted 處理

// --- 監聽與掛載 (仿照成功頁面的強健模式) ---
watch(
  () => userConfig?.sheet_id, 
  async (newId) => {
    if (newId && newId !== 'undefined') {
      console.log("[System] Config change detected, fetching...");
      await fetchSessions();
    }
  }
);

onMounted(async () => {
  loading.value = true;
  uploadStatus.value = "正在翻閱學習日誌...";

  try {
    await fetchSessions(); // 確保這內部會更新 sessions.value
    updateFilteredData();  // 資料抓完後，手動觸發一次過濾更新
  } finally {
    setTimeout(() => {
      loading.value = false;
    }, 600);
  }
});


// 保持與 theory.vue 一致的 ID 處理邏輯
const getPaperId = (id) => {
  if (!id) return '';
  const parts = String(id).split('-');
  if (parts.length > 1) {
    parts.pop();
    return parts.join('-');
  }
  return id;
};

const numberToChinese = (num) => {
  const chinese = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  return num <= 10 ? chinese[num] : num;
};

// --- 1. 核心刪除邏輯 ---
const startDeleteLogic = async (session) => {
  const auth = getValidConfig(); 
  if (!auth) return;

  const gasUrl = localStorage.getItem('user_gas_url');
  if (!gasUrl) {
    showAlert('錯誤', '找不到 GAS 設定，無法執行刪除', 'error');
    return;
  }

  loading.value = true;
  isDeleting.value = true;
  uploadStatus.value = '正在移除紀錄...';

  try {
    // 💡 改為直接連向 GAS
    const response = await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors', // 保持一致
      body: JSON.stringify({
        action: 'delete_session',
        sessionId: session.sessionId,
        sheetName: 'Sessions' // 告訴 GAS 要去哪張表刪除
      })
    });

    // 💡 註：因為 no-cors 無法取得 response.json()，
    // 我們假設請求發出即成功，或者你可以把 mode 改回 cors (如果 GAS 有設定的話)
    // 這裡我們優化體驗，直接在前端移除
    const idx = sessions.value.findIndex(s => s.sessionId === session.sessionId);
    if (idx !== -1) {
      sessions.value.splice(idx, 1);
      updateFilteredData(); 
    }
    showToast?.('紀錄已從雲端移除');

  } catch (err) {
    console.error("刪除失敗:", err);
    showAlert('刪除失敗', '目前無法連線至 GAS 伺服器', 'error');
  } finally {
    loading.value = false;
    isDeleting.value = false;
    uploadStatus.value = '';
  }
};

// --- 2. Modal 控制 ---
const deleteModal = ref({ show: false, session: null });

// 步驟 A：開啟確認視窗 (這要綁定在你的垃圾桶按鈕 @click="confirmDelete(session)")
const confirmDelete = (session) => {
  deleteModal.value = { show: true, session };
};

// 步驟 B：真正執行刪除 (這綁定在 Modal 的「確定」按鈕)
const executeDelete = async () => {
  const session = deleteModal.value.session;
  deleteModal.value.show = false; // 立即關閉視窗
  
  if (!session) return;
  
  // 執行上面定義的邏輯，並傳入要刪除的 session
  await startDeleteLogic(session); 
};


// 處理標題編輯
const onFieldBlur = async (event, session, field) => {
  const newValue = event.target.innerText.trim();
  if (newValue === session[field]) return; // 沒變就不動

  const oldValue = session[field];
  session[field] = newValue; // 先更新 UI

  try {
    await updateSessionInDB(session); // 呼叫你更新 Firebase/資料庫的函式
    // 可以加一個小小的 Toast 提示「儲存成功」
  } catch (error) {
    session[field] = oldValue; // 失敗了就復原
    showAlert('儲存失敗', '無法同步至雲端，請檢查網路連線', 'error');
  }
};

// 處理清單點位編輯
const onPointBlur = async (event, session, index) => {
  const newValue = event.target.innerText.trim();
  if (newValue === session.points[index]) return;

  const oldPoints = [...session.points];
  session.points[index] = newValue;

  try {
    await updateSessionInDB(session);
  } catch (error) {
    session.points = oldPoints;
    showAlert('更新失敗', '重點內容同步失敗，請稍後再試', 'error');
  }
};

// 前端更新邏輯
const updateSessionInDB = async (session) => {
  // 1. 🛡️ 門禁守衛
  const auth = getValidConfig(); 
  if (!auth) return;

  const gasUrl = localStorage.getItem('user_gas_url');
  if (!gasUrl) {
    showAlert('設定缺失', '請先配置 GAS 連結', 'error');
    return;
  }
  // 🛡️ 防呆：確保 points 是字串
  const pointsValue = Array.isArray(session.points) 
    ? JSON.stringify(session.points) 
    : session.points;

  try {
    // 💡 改為直接對接 GAS
   await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors', 
      body: JSON.stringify({
        action: 'update_session',
        sessionId: session.sessionId,
        updates: {
          topic: session.topic,
          points: pointsValue
        }
      })
    });

    // 這裡印一下 Log，確認前端有發出這筆資料
    console.log("已發送更新請求:", session.sessionId, session.topic);

    // 🌟 因為 no-cors 無法得知成功與否，我們假設只要沒噴 Error 就是發送成功
    showAlert(
      '雲端同步完成', 
      `「${session.topic || '內容'}」已成功更新`, 
      'success'
    );
    
  } catch (err) {
    console.error("GAS Update Error:", err);
    showAlert('同步失敗', '無法連線至 Google 服務', 'error');
  }
};

// 建立與 theory.vue 一致的配置物件
const alertConfig = ref({
  show: false,
  type: 'success',
  title: '',
  message: ''
});

// 封裝一個彈窗函式
const showAlert = (title, message, type = 'success') => {
  alertConfig.value = {
    show: true,
    title,
    message,
    type
  };
  
  // 3秒後自動關閉
  setTimeout(() => {
    alertConfig.value.show = false;
  }, 3000);
};
</script>



<style scoped>
/* --- 原有動畫保留 --- */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.scale-enter-active {
  animation: scale-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes scale-in {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.fade-enter-active, .fade-leave-active {
  transition: all 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  /* 只有在背景遮罩時才會觸發 blur */
  backdrop-filter: blur(0px);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}

/* --- ✨ 針對身分識別新增的視覺強化 (不影響原本佈局) --- */

/* 個人筆記：使用溫暖的琥珀色調與淡淡的紙張陰影 */
.border-amber-200 {
  border-color: #FDE68A !important; /* 琥珀色邊框 */
  background-color: rgba(255, 251, 235, 0.4); /* 極淺黃背景 */
  box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.08); /* 溫暖的陰影 */
}

/* 官方紀錄：保持專業、冷調的設計 */
.border-[#EEEBE5] {
  box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.03);
}

/* 強化標籤的文字可讀性 */
.tracking-widest {
  letter-spacing: 0.2em !important;
}

/* 列表項目的微交互：滑過時輕微上浮 */
.hover\:shadow-md:hover {
  transform: translateY(-2px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 滾動條美化 (針對編輯器內長文本) */
textarea::-webkit-scrollbar {
  width: 4px;
}
textarea::-webkit-scrollbar-thumb {
  background: #E5E7EB;
  border-radius: 10px;
}


/* 讓過場更滑順的縮放效果 */
.fade-in-scale-enter-active, .fade-in-scale-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-in-scale-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}
.fade-in-scale-leave-to {
  opacity: 0;
  transform: scale(1.1);
}
@keyframes slow-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-slow-spin {
  animation: slow-spin 2s linear infinite;
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .relative { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-enter-from .relative { transform: scale(0.9) translateY(20px); }

/* 這是讓通知「從上方滑入」並帶有「縮放感」的關鍵動畫 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.notification-enter-from {
  opacity: 0;
  transform: translate(-50%, -40px) scale(0.9); /* 從更上面滑下來 */
}

.notification-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.95);
}

/* 🌟 統一全域遮罩樣式 */
.global-loader-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.loader-spinner {
  width: 32px; height: 32px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.loader-text { margin-top: 20px; font-size: 0.75rem; letter-spacing: 0.4em; color: #64748b; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

</style>
