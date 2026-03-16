<template>
  <div class="min-h-screen bg-[#F8F9FA] p-6 lg:p-12">
    <header class="max-w-6xl mx-auto flex justify-between items-end mb-12">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <span class="text-3xl">🏥</span>
          <h1 class="text-2xl font-black tracking-tighter text-gray-900 uppercase">AI 診療中心</h1>
        </div>
        <p class="text-[10px] font-bold text-gray-400 tracking-[0.3em] uppercase">
          PATIENT: {{ currentStudent }} | DEPT: {{ selectedSubject }}
        </p>
      </div>
      <div class="text-[10px] text-gray-400 font-bold mb-2">
        正在掃描細項：{{ subjectConfigs[selectedSubject]?.cats.join('、') }}
      </div>
      <button 
        @click="handleStartDiagnosis"
        :disabled="isAnalyzing"
        class="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] hover:scale-105 transition-all disabled:opacity-30 shadow-2xl shadow-gray-200"
      >
        {{ isAnalyzing ? 'ANALYZING...' : '啟動全面診斷' }}
      </button>
    </header>

    <div class="max-w-6xl mx-auto mb-10">
      <div class="flex gap-3 overflow-x-auto pb-2 no-scrollbar border-b border-gray-50">
        <button 
          v-for="(config, name) in subjectConfigs" 
          :key="name"
          @click="selectedSubject = name"
          :disabled="loading" 
          :class="[
            'px-5 py-2 rounded-full text-[11px] font-black tracking-widest transition-all duration-300 whitespace-nowrap',
            selectedSubject === name 
              ? 'bg-[#333333] text-white shadow-lg shadow-gray-200' 
              : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100',
            loading ? 'cursor-wait opacity-80' : ''
          ]"
        >
          {{ name }}
        </button>
      </div>
    </div>

    <div class="max-w-6xl mx-auto mb-10 px-2 flex flex-col gap-6">
  
  <div class="flex items-center justify-between border-b border-gray-50 pb-4">
    <div class="flex items-center gap-4">
      <span class="text-[10px] font-black text-gray-400 tracking-widest uppercase">診斷目標範圍：</span>
      <div class="flex items-center gap-3">
        <div class="relative">
          <select 
            v-model="selectedTitle"
            class="appearance-none bg-white border border-gray-100 text-[11px] font-bold py-1.5 pl-3 pr-9 rounded-xl outline-none focus:ring-1 focus:ring-black cursor-pointer hover:border-gray-300 transition-all shadow-sm min-w-[180px]"
          >
            <option v-for="t in availableTitles" :key="t" :value="t">
                {{ t }} 
                <span v-if="titleStats[t]">
                    ({{ titleStats[t].total }})
                </span>
            </option>
          </select>
          <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </div>

        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-50 bg-white shadow-sm h-[32px]">
<span v-if="titleStats[selectedTitle]" 
  :class="[
    'text-[9px] font-black px-1.5 py-0.5 rounded mr-1 transition-all duration-300',
    titleStats[selectedTitle]?.total > 0 
      ? 'bg-red-50 text-red-500' 
      : 'bg-green-50 text-green-500'
  ]"
>
  {{ titleStats[selectedTitle]?.total }} 錯題
</span>

        <div :class="[
            'w-1.5 h-1.5 rounded-full transition-all duration-500',
            isAnalyzing ? 'bg-orange-400 animate-pulse' : (isTitleDiagnosed ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-200')
        ]"></div>
        
        <span class="text-[8px] font-black tracking-widest uppercase whitespace-nowrap" 
            :class="isTitleDiagnosed ? 'text-blue-600' : 'text-gray-400'">
            {{ isAnalyzing ? 'Scanning...' : (isTitleDiagnosed ? 'Log Exist' : 'Ready to Scan') }}
        </span>
        </div>
      </div>
    </div>
  </div>

  <div class="flex items-center justify-between">
<div class="flex items-center gap-3">
  <span class="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase">目前狀態：</span>
  
  <span :class="[
    'text-[10px] font-black px-3 py-1 rounded-full transition-all duration-500',
    currentSubjectErrors.length > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
  ]">
    {{ currentSubjectErrors.length > 0 ? `${currentSubjectErrors.length} 處思維漏洞` : '思維架構完備' }}
  </span>
<div v-if="titleStats[selectedTitle]" class="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100/50 px-2 py-1 rounded-lg">
  <span class="opacity-50">卷別總體：</span>
  <span class="text-red-400">{{ titleStats[selectedTitle]?.wrong }}</span>
  <span class="opacity-30">/</span>
  <span>{{ titleStats[selectedTitle]?.total }}</span>
</div>
</div>
    
    <div class="flex items-center gap-1.5 opacity-60">
    <span class="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
    <ClientOnly>
  <div class="text-[8px] font-bold text-gray-300 uppercase tracking-tighter opacity-50">
    Last Synced: {{ new Date().toLocaleTimeString() }}
  </div>
</ClientOnly>
    </div>
  </div>
</div>

    <nav class="max-w-6xl mx-auto flex gap-16 border-b border-gray-100 mb-10">
      <button 
        v-for="tab in clinicTabs" 
        :key="tab.id"
        @click="activeTab = tab.label"
        class="pb-6 group relative transition-all"
      >
        <div class="flex flex-col items-start">
          <span :class="[
            'text-[13px] font-black tracking-[0.3em] transition-all duration-500', 
            activeTab === tab.label ? 'text-black translate-y-0' : 'text-gray-300 group-hover:text-gray-400 translate-y-1'
          ]">
            {{ tab.label }}
          </span>
          <span class="text-[8px] font-bold text-gray-300 tracking-[0.2em] mt-2 opacity-40 group-hover:opacity-100 transition-opacity uppercase">
            {{ tab.sub }}
          </span>
        </div>
        <div v-if="activeTab === tab.label" 
          class="absolute bottom-0 left-0 w-full h-[2px] bg-black animate-in fade-in slide-in-from-left duration-500">
        </div>
      </button>
    </nav>

    <main class="max-w-6xl mx-auto">
<div v-if="isAnalyzing" 
     class="relative overflow-hidden py-24 px-8 rounded-[40px] bg-white border border-blue-50 shadow-[0_20px_50px_rgba(0,0,0,0.02)] transition-all duration-700">
  
  <div class="absolute -top-24 -left-24 w-96 h-96 bg-blue-50/50 rounded-full blur-[100px]"></div>
  <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-50/50 rounded-full blur-[100px]"></div>

  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent absolute top-0 animate-[scan_3s_infinite]"></div>
  </div>

  <div class="relative z-10 flex flex-col items-center">
    <div class="relative mb-12">
      <div class="w-24 h-24 rounded-full border-[1px] border-blue-100 flex items-center justify-center">
        <div class="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
        <div class="w-16 h-16 rounded-full bg-blue-50/50 flex items-center justify-center">
           <span class="text-3xl animate-pulse">🧬</span>
        </div>
      </div>
    </div>

    <div class="w-full max-w-sm">
      <div class="flex items-center justify-center gap-3 text-blue-600 font-black text-[11px] mb-6 tracking-[0.4em]">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
        </span>
        CORE ANALYSIS IN PROGRESS
      </div>

      <div class="space-y-4 px-6 py-5 rounded-3xl bg-blue-50/30 border border-blue-100/50 backdrop-blur-sm">
        <div class="flex items-center gap-3">
          <div class="w-1 h-1 bg-blue-400 rounded-full"></div>
          <p class="text-[11px] text-blue-800/70 font-bold font-mono">LOADING ERROR SAMPLES: {{ currentSubjectErrors.length }} ITEMS</p>
        </div>
        <div class="flex items-center gap-3 opacity-0 animate-[fadeIn_0.5s_ease-out_0.8s_forwards]">
          <div class="w-1 h-1 bg-blue-400 rounded-full"></div>
          <p class="text-[11px] text-blue-800/70 font-bold font-mono">SYNCING WITH GEMINI-3-FLASH...</p>
        </div>
        <div class="flex items-center gap-3 opacity-0 animate-[fadeIn_0.5s_ease-out_1.6s_forwards]">
          <div class="w-1 h-1 bg-blue-400 rounded-full"></div>
          <p class="text-[11px] text-blue-800/70 font-bold font-mono">RECONSTRUCTING LOGIC PATCHES...</p>
        </div>
      </div>
    </div>

    <div class="mt-12 w-full max-w-[280px] h-1 bg-blue-100/50 rounded-full overflow-hidden">
      <div class="h-full bg-blue-500 animate-[progress_2.5s_ease-in-out_infinite] w-full origin-left"></div>
    </div>
  </div>
</div>

      <section v-else-if="activeTab === '盲點溯源'" class="space-y-6 fade-in">
        <div v-if="clinicData" class="bg-white p-12 rounded-[40px] shadow-sm border border-gray-50 relative overflow-hidden">
          <div class="absolute top-0 right-0 p-8 opacity-5">
            <span class="text-9xl font-black">{{ selectedSubject }}</span>
          </div>
          <div class="flex gap-2 mb-8">
            <span v-for="tag in clinicData.tags" :key="tag" 
              class="text-[9px] font-black px-4 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-gray-400 uppercase tracking-widest">
              # {{ tag }}
            </span>
          </div>
          <p class="text-xl text-gray-800 leading-[1.8] font-medium mb-10 max-w-3xl relative z-10">
            {{ clinicData.summary }}
          </p>
          <div class="flex items-center justify-between pt-6 border-t border-gray-50">
            <div class="text-[9px] text-gray-300 font-bold uppercase tracking-[0.4em] flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-green-400"></span>
              Scan Date: {{ clinicData.date }}
              <span class="ml-2 px-2 py-0.5 bg-gray-100 text-[8px] rounded">ARCHIVED_LOG</span>
            </div>
            <div class="text-[9px] text-gray-300 font-bold uppercase tracking-[0.2em]">
              Linked Errors: {{ clinicData.wrongIds?.length || 0 }} items
            </div>
          </div>
        </div>

        <div v-else class="text-center py-20 bg-white rounded-[40px] border border-gray-100 border-dashed">
          <div class="mb-4 text-4xl">🔍</div>
          <p class="text-gray-900 text-sm font-black tracking-widest uppercase mb-2">
            偵測到 {{ currentSubjectErrors.length }} 處邏輯缺陷
          </p>
          <p class="text-gray-400 text-[10px] tracking-widest uppercase">
            點擊上方「啟動全面診斷」開始重構思維
          </p>
        </div>
      </section>

    <section v-else-if="activeTab === '思維重構'" class="grid grid-cols-1 md:grid-cols-2 gap-8 fade-in">
        <div v-if="!clinicData" class="col-span-full text-center py-20 opacity-30 uppercase font-black tracking-widest">
            Wait for Scan... 尚未產生修復建議
        </div>

        <div v-for="(action, i) in clinicData?.actions" :key="i" 
        @click="openDetail(action)"
        class="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group cursor-pointer hover:border-blue-400 hover:shadow-xl transition-all duration-500">
        
                <span class="absolute -right-4 -bottom-6 text-8xl font-black text-gray-50 group-hover:text-blue-50/80 transition-colors italic select-none">
                        0{{ i+1 }}
                </span>
                <div class="relative z-10">

                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Action Step {{ i+1 }}
                        <span class="text-[12px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-md font-black">
                            {{ clinicData.tags[i] || '思維盲點' }}
                        </span>
                        </h4>
                        <span class="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                    </div>

                    <p class="text-gray-700 font-bold leading-relaxed text-lg pr-4">
                    {{ typeof action === 'string' ? action : action.simple }}
                    </p>
                
                    <div class="mt-6 text-[9px] font-black text-gray-300 uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                    Click to view details
                    </div>
                </div>
        </div>
    </section>

    <section v-if="activeTab === '極限實踐'" class="fade-in px-4">
  
<div v-if="clinicData?.quizzes && Object.keys(clinicData.quizzes).length > 0" 
     class="max-w-3xl mx-auto flex items-center justify-center gap-4 mb-10 p-2 bg-[#F9FBFB] rounded-full border border-[#E6EEED]">
    <span class="text-[9px] font-black text-[#94A3A2] uppercase tracking-[0.2em] ml-4">
      History | 測驗記錄
    </span>
    <div class="flex gap-1.5">
      <button 
        v-for="(quizList, vKey) in clinicData.quizzes" 
        :key="vKey"
        @click="switchVersion(vKey)"
        :class="[
          'px-4 py-1.5 rounded-full text-[10px] font-bold transition-all duration-500',
          currentVersion === vKey 
            ? 'bg-[#4A7C66] text-white shadow-sm' 
            : 'bg-white text-[#A0AEC0] border border-[#EDF2F1] hover:border-[#4A7C66] hover:text-[#4A7C66]'
        ]"
      >
        {{ typeof vKey === 'string' ? vKey.toUpperCase() : 'V' + (vKey + 1) }}
      </button>
    </div>
  </div>

  <div class="mb-12 text-center">
    <div class="inline-block px-3 py-1 bg-[#E6F2ED] text-[#4A7C66] rounded-full text-[9px] font-black mb-3 uppercase tracking-widest border border-[#CDE5DB]">
      Final Challenge
    </div>
    <h2 class="text-2xl font-bold text-[#333D3A] tracking-[0.1em]">思維防禦力測試</h2>
    <div class="w-8 h-[1px] bg-[#4A7C66]/20 mx-auto mt-4 mb-3"></div>
    <p class="text-gray-400 text-xs font-medium tracking-wide">針對檢測出的邏輯漏洞，進行最後的實戰演練</p>
  </div>

  <div class="max-w-3xl mx-auto space-y-10">
    <div v-for="(quiz, idx) in practiceQuizzes" :key="idx" :id="idx === 0 ? 'quiz-top' : null"
         class="bg-white p-8 md:p-10 rounded-[32px] border transition-all duration-700 relative"
         :class="userAnswers[idx]?.isCorrect ? 'border-[#CDE5DB] bg-[#FBFDFD]' : 'border-[#F0F2F1] shadow-sm'">
      
      <div class="flex justify-between items-center mb-8">
        <div class="flex items-center gap-3">
          <span class="text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center border transition-colors duration-500"
                :class="userAnswers[idx]?.isCorrect ? 'bg-[#4A7C66] border-[#4A7C66] text-white' : 'border-[#E2E8E7] text-[#94A3A2]'">
            {{ userAnswers[idx]?.isCorrect ? '✓' : idx + 1 }}
          </span>
          <span class="text-[10px] font-bold text-[#B0BDBA] uppercase tracking-widest">Focus Point</span>
        </div>
        <span class="px-3 py-1 bg-[#F7FAF9] rounded-md text-[9px] font-bold text-[#8FA39D] border border-[#EDF2F1]">
          {{ clinicData?.tags[idx] || '思維核心' }}
        </span>
      </div>

      <p class="text-lg font-bold text-[#3A4542] mb-10 leading-relaxed">{{ quiz.question }}</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button v-for="(opt, oIdx) in quiz.options" :key="oIdx"
            @click="handleAnswer(idx, oIdx)"
            :disabled="userAnswers[idx]?.isCorrect"
            class="p-5 rounded-2xl border transition-all duration-300 font-bold text-left text-sm relative group"
            :class="getOptionClass(idx, oIdx)"> 
          <span class="relative z-10">{{ opt }}</span>
        </button>
      </div>

      <transition name="expand">
        <div v-if="userAnswers[idx]?.isWrong" 
             class="mt-8 p-6 bg-[#FEF9F9] rounded-2xl border border-[#FDECEC] flex gap-4 items-start shadow-sm">
          <span class="text-lg mt-0.5">🧐</span>
          <div class="space-y-4 flex-1">
            <div>
              <p class="text-[#BC6C6C] font-black text-[11px] mb-1.5 uppercase tracking-widest">Analysis</p>
              <p class="text-[#8E7474] text-xs leading-relaxed font-medium">
                {{ quiz.explanation || '這個選項藏有陷阱，再檢查一下因果關係。' }}
              </p>
            </div>
            <div class="pt-3 border-t border-[#F9E1E1]">
              <p class="text-[#C4A484] text-[11px] font-bold flex items-center gap-2">
                <span class="w-1 h-1 bg-[#C4A484] rounded-full"></span>
                Hint: {{ quiz.hint || '回想一下核心差異。' }}
              </p>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
  <Transition name="expand">
  <div v-if="clinicData?.is_mastered" 
       class="mt-12 p-10 rounded-[40px] bg-white border-2 border-[#E8DFD8] relative overflow-hidden shadow-xl shadow-[#D8C9B0]/20">
    
    <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#D4AF37] via-[#F1E5AC] to-[#D4AF37]"></div>
    <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-[#F9F6F2] rounded-full opacity-50"></div>
    <div class="absolute right-10 top-10 flex gap-1">
      <div v-for="i in 3" :key="i" class="w-1 h-1 bg-[#D4AF37] rounded-full opacity-30"></div>
    </div>
    
    <div class="relative z-10 flex flex-col items-center">
      <div class="relative mb-8">
        <div class="w-20 h-20 border-2 border-[#D4AF37] rounded-full flex items-center justify-center rotate-12 bg-white shadow-inner">
          <div class="w-16 h-16 border border-[#D4AF37] rounded-full flex flex-col items-center justify-center text-[#D4AF37]">
             <span class="text-[10px] font-black leading-none mb-1 uppercase">Master</span>
             <span class="text-xl font-black italic">100</span>
          </div>
        </div>
        <div class="absolute -bottom-2 -right-4 px-3 py-1 bg-[#344D45] text-white text-[9px] font-black tracking-widest rounded-full shadow-lg">
          PASSED
        </div>
      </div>

      <h3 class="text-2xl font-black text-[#2A2A2A] tracking-[0.15em] mb-4">
        思維架構：修復完成
      </h3>
      
      <p class="text-[#8B837E] text-sm leading-relaxed max-w-md text-center font-medium">
        這份漏洞已被填補。您在 
        <span class="text-[#344D45] font-bold border-b border-[#D4AF37] pb-0.5">{{ selectedSubject }}</span> 
        的思維演算法已成功同步，獲得了面對此類問題的「防禦力」。
      </p>
      
      <div class="mt-8 mb-10 w-full max-w-sm py-4 px-6 bg-[#FDFBF9] border border-[#F2EDE8] rounded-2xl flex justify-around items-center">
        <div class="text-center">
          <p class="text-[9px] text-gray-400 font-bold uppercase mb-1">Status</p>
          <p class="text-xs text-emerald-600 font-black tracking-tighter">SUCCESS</p>
        </div>
        <div class="w-[1px] h-6 bg-gray-100"></div>
       <div class="text-center">
        <p class="text-[9px] text-[#A0AEC0] font-bold uppercase tracking-[0.1em] mb-1">Archive</p>
        <p class="text-[11px] text-[#5A6562] font-bold tracking-wide">已存入檔案庫</p>
      </div>
        <div class="w-[1px] h-6 bg-gray-100"></div>
        <div class="text-center">
          <p class="text-[9px] text-gray-400 font-bold uppercase mb-1">Timestamp</p>
          <p class="text-[10px] text-gray-500 font-medium">{{ clinicData.date.split(' ')[0] }}</p>
        </div>
      </div>
      
      <div class="flex flex-row justify-center gap-4 mt-8">
  
        <button 
          @click="handleResetQuiz"
          class="px-6 py-2.5 rounded-full border border-gray-200 bg-white/60 text-gray-500 text-[11px] font-bold tracking-widest hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-all duration-300 active:scale-95 shadow-sm"
        >
          <div class="flex items-center gap-2">
            <span>RE-TRY</span>
            <span class="w-[1px] h-3 bg-gray-200"></span>
            <span class="font-medium text-[10px]">重測</span>
          </div>
        </button>

        <button 
          @click="handleRegenerateQuizzes"
          class="px-6 py-2.5 rounded-full bg-[#E6F2ED] border border-[#CDE5DB] text-[#4A7C66] text-[11px] font-bold tracking-widest hover:bg-[#DDF0E8] hover:border-[#B8D6C9] transition-all duration-300 active:scale-95 shadow-sm shadow-emerald-100/50"
        >
          <div class="flex items-center gap-2">
            <span>NEW TEST</span>
            <span class="w-[1px] h-3 bg-[#B8D6C9]"></span>
            <span class="font-medium text-[10px]">新挑戰</span>
          </div>
        </button>
        
      </div>

      <div class="mt-8 flex flex-col items-center opacity-40">
        <div class="w-10 h-[1px] bg-[#D4AF37] mb-2"></div>
        <p class="text-[8px] font-black text-gray-400 uppercase tracking-[0.5em]">
          Cognitive Logic Verified
        </p>
      </div>
    </div>
  </div>
</Transition>
</section>
    </main>

<Transition name="fade">
  <div v-if="loading" class="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#F8F9FA]/95 backdrop-blur-xl">
    <div class="relative flex items-center justify-center">
      <div class="w-14 h-14 border-[3px] border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
      
      
    </div>
    
    <div class="mt-8 flex flex-col items-center gap-2">
      <p class="text-[12px] font-black tracking-[0.4em] text-blue-600 uppercase">
        {{ uploadStatus || 'System Synchronizing' }}
      </p>
      
    </div>
  </div>
</Transition>
<Transition name="overlay">
  <div v-if="isAnalyzing" class="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden">
    <div class="absolute inset-0 bg-[#F8F9FA]/90 backdrop-blur-2xl"></div>

    <div class="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[120px] animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-[120px] animate-pulse"></div>

    <div class="relative z-10 flex flex-col items-center max-w-lg w-full px-10">
      
      <div class="relative mb-12">
        <div class="w-24 h-24 flex items-center justify-center bg-white rounded-full shadow-xl relative z-10">
          <span class="text-4xl animate-bounce">🧪</span>
        </div>
        <div class="absolute -inset-2 border border-blue-100 rounded-full animate-ping opacity-20"></div>
      </div>

      <div class="text-center mb-10">
        <h2 class="text-xl font-black tracking-[0.5em] text-gray-900 uppercase mb-2">
          {{ analysisTitle }}
        </h2>


<p v-html="analysisMessage" class="text-center"></p>
      </div>

      <div class="w-full bg-white/50 border border-white rounded-[32px] p-8 shadow-sm backdrop-blur-md">
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <span class="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,1)]"></span>
            <p class="text-[11px] font-mono font-bold text-gray-600 uppercase tracking-widest">Target: {{ selectedSubject }} ({{ selectedTitle }})</p>
          </div>
          <div class="flex items-center gap-4 opacity-0 animate-[fadeIn_0.5s_ease-out_1s_forwards]">
            <span class="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            <p class="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-widest">Analyzing {{ currentSubjectErrors.length }} error patterns...</p>
          </div>
          <div class="flex items-center gap-4 opacity-0 animate-[fadeIn_0.5s_ease-out_2s_forwards]">
            <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            <p class="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-widest">Generating logic reconstruction patches...</p>
          </div>
        </div>
      </div>

      <div class="mt-12 w-64 h-[2px] bg-gray-100 rounded-full overflow-hidden">
        <div class="h-full bg-blue-500 w-full origin-left animate-[loading_4s_ease-in-out_infinite]"></div>
      </div>
    </div>
  </div>
</Transition>
  </div>

  <Transition name="fade">
  <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm" @click.self="isModalOpen = false">
    
    <div class="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
      <div class="h-2 bg-blue-500"></div>
      
      <div class="p-8 md:p-10">
        <div class="flex justify-between items-start mb-6">
          <div>
            <span class="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">思維指導說明</span>
            <h3 class="text-2xl font-black text-gray-800 mt-1">
              {{ activeAction?.simple || '行動詳情' }}
            </h3>
          </div>
          <button @click="isModalOpen = false" class="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <div class="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 mb-6">
            <p class="text-gray-700 leading-loose text-base font-medium">
              {{ activeAction?.detail }}
            </p>
          </div>

          <div v-if="activeAction?.how_to" class="mb-6">
            <h4 class="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span class="w-4 h-[1px] bg-blue-200"></span> 實作工具箱
            </h4>

            <div v-if="activeAction.how_to.type === 'table'" class="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table class="w-full text-sm">
                <thead>
                <tr class="bg-gray-100">
                    <th v-for="(h, hi) in activeAction.how_to.data[0]" :key="hi" 
                        :class="['p-3 text-left font-black text-gray-700 border-b border-gray-200', 
                                hi === 1 ? 'bg-blue-50 text-blue-700' : '', 
                                hi === 2 ? 'bg-green-50 text-green-700' : '']">
                    {{ h }}
                    </th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(row, ri) in activeAction.how_to.data.slice(1)" :key="ri">
                    <td v-for="(cell, ci) in row" :key="ci" 
                        :class="['p-3 border-b border-gray-50', 
                                ci === 1 ? 'bg-blue-50/20' : '', 
                                ci === 2 ? 'bg-green-50/20' : '']">
                    {{ cell }}
                    </td>
                </tr>
                </tbody>
            </table>
            </div>

            <ul v-else-if="activeAction.how_to.type === 'list'" class="space-y-3">
              <li v-for="(item, li) in activeAction.how_to.data" :key="li" class="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl text-gray-600 text-sm">
                <span class="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {{ li + 1 }}
                </span>
                {{ item }}
              </li>
            </ul>
          </div>

          <div class="flex items-center gap-3 px-6 py-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700">
            <span class="text-lg">🎯</span>
            <p class="text-xs font-bold leading-tight">
              <span class="block text-[10px] opacity-50 uppercase">Training Goal</span>
              {{ activeAction?.goal }}
            </p>
          </div>
        </div>

        <div class="mt-8 flex justify-center">
          <button @click="isModalOpen = false" 
            class="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-200 active:scale-95">
            我理解了，開始實踐
          </button>
        </div>
      </div>
    </div>
  </div>
</Transition>

</template>
<script setup>
import { ref, inject, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useAuth } from '~/composables/useAuth'

// 1. 注入全局狀態與配置
const subjectConfigs = inject('subjectConfigs');
const userConfig = inject('userConfig');
const showToast = inject('showToast');
const route = useRoute(); 
const { getValidConfig } = useAuth();

// 2. 狀態管理
const activeTab = ref('盲點溯源');
const isAnalyzing = ref(false);
const clinicData = ref(null);
const selectedSubject = ref('國文'); // 預設值，稍後會被 query 覆蓋
const allQuestions = ref([]); 
const selectedTitle = ref('全部卷別'); // 預設值，稍後會被 query 覆蓋
const isTitleDiagnosed = ref(false); // 🚩 這裡只保留一個定義
const isModalOpen = ref(false); // 控制 Modal 顯示與否
const activeAction = ref(null); // 儲存目前選中的行動詳情
const practiceQuizzes = ref([]);
const quizStates = ref([]); // 記錄每一題的狀態：'pending', 'correct', 'wrong'
const userAnswers = ref({});
const analysisMessage = ref('正在進行深度思維架構診斷...');
const analysisTitle = ref('Deep Logic Scanning');
const currentVersion = ref('v1');

// 1. 定義全域載入狀態 (控制全螢幕轉圈)
const loading = ref(false);

// 2. 定義載入時顯示的文字內容
const uploadStatus = ref('');

// 3. 學生資料
const currentStudent = ref(userConfig?.userName || 'Anna');

const safeParse = (val) => {
  // 1. 攔截真正的空值或字串形式的空值
  if (val === null || val === undefined || val === '' || val === 'null' || val === 'undefined') {
    return null;
  }
  
  // 2. 如果已經是物件（Array 或 Object），直接回傳
  if (typeof val === 'object') return val;
  
  // 3. 嘗試解析字串
  try { 
    return JSON.parse(val); 
  } catch (e) { 
    // 這裡檢查是否本來就是純文字而非 JSON 字串
    // 如果解析失敗但它是有內容的字串，就視需求決定回傳 null 還是原字串
    console.warn("解析 JSON 失敗，回傳 null:", val);
    return null; 
  }
};

// --- 🚩 新增：處理外部跳轉跳入的邏輯 ---
const handleIncomingQuery = () => {
  const { subject, title, mode } = route.query;
  console.log("route.query=",route.query);
  if (subject) {
    selectedSubject.value = subject;
    console.log('✅ 已自動對準科目:', subject);
  }
  
  if (title) {
    selectedTitle.value = title;
    console.log('✅ 已自動鎖定卷別:', title);
  }

  // 根據傳過來的模式切換 Tab
  if (mode === 'patch' || title) {
    activeTab.value = '思維重構'; 
  }
};

// 4. Tab 設定
const clinicTabs = [
  { id: 'scan', label: '盲點溯源', sub: 'BUG TRACING' },
  { id: 'patch', label: '思維重構', sub: 'LOGIC REBUILD' },
  { id: 'stress', label: '極限實踐', sub: 'UNIT TESTING' }
];

// 開啟 Modal 的函式
const openDetail = (action) => {
  activeAction.value = action;
  isModalOpen.value = true;
};

// 1. 定義獲取 Session 的工具
const getSession = () => {
  if (process.server || typeof window === 'undefined') return {}; 
  try {
    const data = localStorage.getItem('allegro_auth_session');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("讀取 Session 失敗:", e);
    return {};
  }
};

// 2. 計算屬性：提取可用卷別
const availableTitles = computed(() => {
  if (!allQuestions.value || allQuestions.value.length === 0) {
    return ['全部卷別'];
  }
  const config = subjectConfigs?.[selectedSubject.value];
  const validSubCats = (config?.cats || []).map(c => String(c).trim());
  const titles = allQuestions.value
    .filter(q => {
      const qCat = String(q.category || '').trim();
      const isMatchedCat = validSubCats.length === 0 || validSubCats.includes(qCat);
      return isMatchedCat;
    })
    .map(q => {
      return String(q.title || q['卷別'] || '').trim();
    })
    .filter(Boolean); 
  return ['全部卷別', ...new Set(titles)];
});

const getOptionClass = (qIdx, oIdx) => {
  const answer = userAnswers.value[qIdx];
  const isSelected = answer?.selected === oIdx;
  const isCorrect = practiceQuizzes.value[qIdx].answer === ['A', 'B', 'C', 'D'][oIdx];

  if (!answer) {
    return 'bg-white border-[#F0F2F1] text-[#5A6562] hover:border-[#4A7C66] hover:bg-[#F9FBFB] shadow-sm';
  }
  if (answer.isCorrect) {
    if (isCorrect) {
      return 'bg-[#F2F9F6] border-[#4A7C66] text-[#344D45] shadow-sm';
    }
    return 'bg-white border-[#F0F2F1] text-[#A0AEC0] opacity-60';
  }
  if (answer.isWrong) {
    if (isSelected) {
      return 'bg-[#FEF9F9] border-[#BC6C6C] text-[#BC6C6C] shadow-sm';
    }
    if (isCorrect) {
       return 'bg-white border-[#4A7C66]/30 border-dashed text-[#4A7C66]';
    }
    return 'bg-white border-[#F0F2F1] text-[#A0AEC0] opacity-60';
  }
  return 'bg-white border-[#F0F2F1] text-[#5A6562]';
};

// 抓取原始題目資料
const fetchStudentData = async (forceLoading = false) => {
  const auth = getValidConfig();
  if (!auth) return;

  // 🚩 如果呼叫時傳入 true，就啟動轉圈
  if (forceLoading) {
    loading.value = true;
    uploadStatus.value = "正在同步最新題庫...";
  }

  try {
    // 🚩 從原本的 Vercel API 改為請求 GAS
    const gasUrl = localStorage.getItem('user_gas_url');
    
    const response = await fetch(gasUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'fetch_data',
        sheetName: auth.userName, // 傳入 Emma (原本的 tabName)
        studentId: auth.student_id  // 保持結構一致性
      })
    });

    const result = await response.json();

    // 🚩 保持原本設計：將結果存入 allQuestions.value
    // 注意：GAS 回傳的是 { success: true, data: [...] }
    if (result?.success) {
      allQuestions.value = result.data || [];
      console.log('✅ 題庫同步成功，總數:', allQuestions.value.length);
    }
  } catch (e) {
    console.error('❌ [Clinic Fetch Error]', e);
    showToast('無法讀取題庫，請確認網路連線', 'error');
  } finally {
    // 🚩 結束後關閉轉圈
    if (forceLoading) {
      loading.value = false;
      uploadStatus.value = "";
    }
  }
};

// 🚩 核心：讀取歷史診斷紀錄 (整合版)
const fetchTargetDiagnosis = async (params = {}) => {
  if (process.server) return;
  
  // 🛡️ 門禁守衛
  const auth = getValidConfig();
  if (!auth) return; 

  const studentId = auth.student_id;
  const sheetId = auth.sheet_id;
  const sub = params.subject || selectedSubject.value;
  const tit = params.title || selectedTitle.value || '全部卷別';

  try {
    // 🚩 核心修改：切換為 GAS 請求
    const gasUrl = localStorage.getItem('user_gas_url');
    const targetSheetName = `${auth.userName}_Clinic`; // 對齊後端 xxxx_Clinic 邏輯

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

    // 🚩 模擬原本 Vercel 的 response.success && response.data 結構
    // 從 GAS 回傳的陣列中找到匹配科目與卷別的一列
    if (res.success && res.data) {
      const foundData = res.data.find(r => 
        String(r.subject || r.Subject || '').trim() === String(sub).trim() && 
        String(r.title || r.Title || '').trim() === String(tit).trim()
      );

      if (foundData) {
        // --- 🟢 以下完全保留你原始的解析與攤平邏輯，不做任何更動 ---
        const d = foundData;
        const extraData = safeParse(d.diagnosis_json) || {};
        
        // 解析並準備修改
        let rawQuizzes = safeParse(d.quizzes) || extraData.quizzes || {};
        let rawResults = safeParse(d.quiz_results) || extraData.quiz_results || {};

        // 攤平 Quizzes 與 Results 的巢狀結構
        Object.keys(rawQuizzes).forEach(vKey => {
          const val = rawQuizzes[vKey];
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            const innerKeys = Object.keys(val);
            if (innerKeys.length > 0) rawQuizzes[vKey] = val[innerKeys[0]];
          }
        });

        Object.keys(rawResults).forEach(vKey => {
          const val = rawResults[vKey];
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            const innerKeys = Object.keys(val);
            if (innerKeys.length > 0) rawResults[vKey] = val[innerKeys[0]];
          }
        });

        const versions = Object.keys(rawQuizzes);
        const lastVer = versions.length > 0 ? versions[versions.length - 1] : 'v1';
        currentVersion.value = lastVer; 

        const rawIsMastered = d.is_mastered ?? extraData.is_mastered;
        const isMastered = rawIsMastered === true || String(rawIsMastered).toUpperCase() === 'TRUE';

        clinicData.value = {
          summary: d.summary || extraData.summary,
          tags: safeParse(d.tags) || extraData.tags || [],
          actions: safeParse(d.actions) || extraData.actions || [],
          wrongIds: safeParse(d.wrongIds) || extraData.wrongIds || [],
          date: d.date || d.Date,
          is_mastered: isMastered,
          quizzes: rawQuizzes,        
          quiz_results: rawResults    
        };
        
        const currentQuizzes = rawQuizzes[lastVer] || [];
        const currentResults = rawResults[lastVer] || [];

        if (Array.isArray(currentQuizzes) && currentQuizzes.length > 0) {
          practiceQuizzes.value = currentQuizzes;
          userAnswers.value = {};
          if (isMastered) {
            const restoredAnswers = {};
            currentQuizzes.forEach((_, idx) => {
              const savedRes = currentResults[idx];
              restoredAnswers[idx] = { 
                isCorrect: true, 
                selected: (savedRes && typeof savedRes.selected !== 'undefined') ? savedRes.selected : null,
                isWrong: false
              };
            });
            userAnswers.value = restoredAnswers; 
          }
        } else {
          practiceQuizzes.value = [];
          userAnswers.value = {};
        }
        isTitleDiagnosed.value = true;
        // --- 🟢 原始邏輯結束 ---
      } else {
        // 找不到對應科目卷別的紀錄
        clinicData.value = null;
        isTitleDiagnosed.value = false;
        practiceQuizzes.value = [];
        userAnswers.value = {}; 
      }
    } else {
      // 請求失敗
      clinicData.value = null;
      isTitleDiagnosed.value = false;
      practiceQuizzes.value = [];
      userAnswers.value = {}; 
    }
  } catch (e) {
    console.error("❌ [GAS Clinic History Fetch Error]:", e);
  }
  await new Promise(resolve => setTimeout(resolve, 800));
};

// 啟動診斷
const handleStartDiagnosis = async (force = false) => {
  // 🛡️ 🚩 門禁守衛：從 getValidConfig 獲取統一資料
  const auth = getValidConfig();
  if (!auth) return;

  if (!force && currentSubjectErrors.value.length === 0) {
    showToast('目前邏輯架構穩定，無需部署補丁。', 'info');
    return;
  }

// 🚩 修正判斷邏輯：如果 clinicData 還沒有資料，代表是「全新診斷」
  const isActuallyNew = !clinicData.value || !clinicData.value.quizzes;
  
  analysisTitle.value = (force && !isActuallyNew) ? 'Logic Patch Re-Generation' : 'Deep Logic Scanning';
  analysisMessage.value = (force && !isActuallyNew) ? '正在重新編譯挑戰題目...' : '正在進行深度思維架構診斷...';
  isAnalyzing.value = true;

// 🚩 現在 displayName 會是「碼農媽媽」而非「s001」
  const displayName = auth.userName; 
  isAnalyzing.value = true;

  try {
    const errorPayload = currentSubjectErrors.value.map(q => ({
      title: q.title || '無標題',
      point: q.knowledge_point || '未標註知識點',
      user: q.user_answer || '未作答',
      correct: q.correct_answer || '無標準答案'
    }));

    const result = await $fetch('/api/analyze-clinic', {
      method: 'POST',
     body: {
        student_id: auth.student_id,
        studentName: displayName, 
        subject: selectedSubject.value,
        title: selectedTitle.value,
        // 傳遞錯題資料
        errors: currentSubjectErrors.value.map(q => ({
          title: q.title,
          point: q.knowledge_point,
          user: q.user_answer,
          correct: q.correct_answer
        })),
        sheetId: auth.sheet_id
      }
    }).catch(err => {
      // 🚩 這裡最關鍵：如果網路層級就報錯（例如 429 或 500），直接攔截
      return { success: false, message: err.data?.message || err.message };
    });

    if (!result || result.success === false) {
      const errorMsg = result?.message || '';

      // 🚩 針對你遇到的 429 額度問題進行特殊處理
      if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        showToast('AI 額度已達上限或太頻繁，請稍後再試', 'error'); // 改用 error 更顯眼
        
        isAnalyzing.value = true; 
        analysisTitle.value = "Quota Exceeded";
        // 在攔截 429 錯誤的地方
        analysisMessage.value = `<span style="font-size: 24px; font-weight: bold; color: #ef4444;">⚡️ AI 能量耗盡，請稍候再啟動...</span>`;
        
        setTimeout(() => {
          isAnalyzing.value = false;
        }, 7000); // 額度問題通常要等久一點，這裡先設 15 秒

        return; 
      }

      throw new Error(errorMsg || 'API_FAILED');
    }

    const now = new Date();
    const timeLabel = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    let currentQuizzesObj = {};
    if (clinicData.value?.quizzes) {
      currentQuizzesObj = Array.isArray(clinicData.value.quizzes) 
        ? { "V1 (Legacy)": clinicData.value.quizzes } 
        : clinicData.value.quizzes;
    }

    const vKeys = Object.keys(currentQuizzesObj);
    let nextVer;
    if (force || vKeys.length === 0) {
      nextVer = `V${vKeys.length + 1} (${timeLabel})`;
    } else {
      nextVer = vKeys[vKeys.length - 1];
    }
    currentVersion.value = nextVer;

    const newData = {
      ...clinicData.value, 
      tags: result.tags || ["數據掃描"],
      summary: result.summary || "分析完成",
      actions: result.actions || [],
      quizzes: {
        ...currentQuizzesObj,
        [nextVer]: result.quizzes 
      },
      quiz_results: {
        ...(Array.isArray(clinicData.value?.quiz_results) ? { v1: clinicData.value.quiz_results } : (clinicData.value?.quiz_results || {})),
        [nextVer]: [] 
      },
      date: new Date().toLocaleString(),
      wrongIds: currentSubjectErrors.value.map(q => q.id || q.ID).filter(Boolean),
      title: selectedTitle.value,
      is_mastered: false 
    };

    clinicData.value = newData;
    practiceQuizzes.value = result.quizzes; 

    // 🚩 關鍵修正：分析完畢後立即執行「雲端存檔」
    await saveDiagnosisToSheet(newData); 
    
    // 🚩 修正：更新成功後，讓系統重新標記已診斷
    isTitleDiagnosed.value = true;

// 🚩 核心修正 A：清空作答狀態（跟重做一樣）
    userAnswers.value = {}; 


    // 🚩 核心修正 C：UI 跳轉至第一題
    await nextTick(); // 確保 DOM 已更新
    setTimeout(() => {
      scrollToFirstQuiz(); // 執行捲動
      showToast(force ? '補丁已重新生成' : '深度診斷完成，請開始思維挑戰', 'success');
    }, 100);

  } catch (e) {// 🚩 這裡不要只用 console.warn，一定要用 showToast 讓 UI 有反應
    console.error("診斷過程發生異常:", e);
    showToast(`診斷失敗：${e.message || '伺服器未回應'}`, 'error');
  } finally {
    // 只有在不是「冷卻中」的狀態下，才關閉轉圈，否則會被上面的 return 攔截
    if (analysisTitle.value !== "Quota Exceeded") {
      isAnalyzing.value = false;
    }
  }
};

// 計算每個卷別的錯誤率
const titleStats = computed(() => {
  const stats = {};
  const config = subjectConfigs ? subjectConfigs[selectedSubject.value] : null;
  const validSubCats = (config?.cats || []).map(c => String(c).trim());

  if (!allQuestions.value) return { '全部卷別': { total: 0, wrong: 0 } };

  allQuestions.value.forEach(q => {
    const qCat = String(q.category || '').trim();
    if (validSubCats.length > 0 && !validSubCats.includes(qCat)) return;
    
    const t = q.title?.trim() || '未分類';
    if (!stats[t]) stats[t] = { total: 0, wrong: 0 };
    
    stats[t].total++;
    if (String(q.is_mastered).toUpperCase() === 'FALSE') {
      stats[t].wrong++;
    }
  });

  const allTotal = Object.values(stats).reduce((a, b) => a + b.total, 0);
  const allWrong = Object.values(stats).reduce((a, b) => a + b.wrong, 0);
  stats['全部卷別'] = { total: allTotal, wrong: allWrong };

  return stats;
});

// --- 修改後的 handleAnswer ---
const handleAnswer = async (quizIdx, optionIndex) => {
  const quiz = practiceQuizzes.value[quizIdx];
  if (!quiz) return;

  const selectedText = quiz.options[optionIndex];
  const isCorrect = selectedText.startsWith(quiz.answer) || selectedText === quiz.answer;

  // 更新本地暫存答案
  userAnswers.value = {
    ...userAnswers.value,
    [quizIdx]: {
      selected: optionIndex,
      isCorrect: isCorrect,
      isWrong: !isCorrect
    }
  };

  if (isCorrect) {
    showToast('太棒了！', 'success');
    const allCorrect = practiceQuizzes.value.every((_, idx) => userAnswers.value[idx]?.isCorrect);
    
    if (allCorrect) {
      // 🚩 核心修正：動態獲取當前最新的版本 Key
      // 如果 clinicData 裡有資料，確保抓取的是 quizzes 物件中最後一個 Key (即當前練習的版本)
      const vKeys = Object.keys(clinicData.value?.quizzes || {});
      const targetVer = vKeys.length > 0 ? vKeys[vKeys.length - 1] : currentVersion.value;
      
      console.log(`🎯 檢測通過，準備存入版本: ${targetVer}`);

      if (!clinicData.value) clinicData.value = {};
      clinicData.value.is_mastered = true;
      
      // 確保 quiz_results 結構正確
      if (!clinicData.value.quiz_results || Array.isArray(clinicData.value.quiz_results)) {
        clinicData.value.quiz_results = {};
      }

      // 將當前答案存入正確的版本欄位
      const currentResArray = practiceQuizzes.value.map((_, idx) => userAnswers.value[idx]);
      clinicData.value.quiz_results[targetVer] = currentResArray;
      
      showToast('🏆 檢測通過！正在同步修復檔案庫...', 'success');
      
      // 執行存檔
      await saveDiagnosisToSheet(clinicData.value);
      
      // 延遲刷新數據
      setTimeout(() => { fetchStudentData(false); }, 1000);
    }
  } else {
    showToast('哎呀，掉進思維陷阱了！請重新思考。', 'warning');
  }
};

const checkAllMastered = async () => {
  const allCorrect = quizStates.value.every(state => state === 'correct');
  if (allCorrect) {
    await updateMasteryStatus(clinicData.value.id, true);
    alert('恭喜安娜！這個單元的思維漏洞已完全修復！');
  }
};

const currentSubjectErrors = computed(() => {
  if (!allQuestions.value) return [];
  const config = subjectConfigs ? subjectConfigs[selectedSubject.value] : null;
  const validSubCats = (config?.cats || []).map(c => String(c).trim());

  return allQuestions.value.filter(q => {
    const qCat = String(q.category || '').trim();
    const isMatchedSubject = validSubCats.includes(qCat);
    const qTitle = String(q.title || '').trim();
    const isMatchedTitle = selectedTitle.value === '全部卷別' || qTitle === selectedTitle.value;
    const isWrong = String(q.is_mastered).toUpperCase() === 'FALSE';
    return isMatchedSubject && isMatchedTitle && isWrong;
  });
});

// 存檔邏輯
const saveDiagnosisToSheet = async (data) => {
  const auth = getValidConfig();
  if (!auth) return;

  loading.value = true;
  uploadStatus.value = "正在同步思維修正至檔案庫...";

  const studentId = auth.student_id;
  const gasUrl = localStorage.getItem('user_gas_url');
  const targetSheetName = `${auth.userName}_Clinic`;

  // 🛡️ 保護：確保標題與診斷物件存在
  let finalTitle = data?.title || clinicData.value?.title || selectedTitle.value || "全部卷別";

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'save_diagnosis', // 🚩 這裡要對應 GAS 裡的 if (action === 'save_diagnosis')
        sheetName: targetSheetName,
        subject: selectedSubject.value,
        title: finalTitle,
        // 🚩 直接傳送診斷物件，讓 GAS 處理「版本合併」與「JSON 字串化」
        diagnosis: {
          summary: data.summary || "",
          tags: data.tags || [],
          actions: data.actions || [],
          quizzes: Array.isArray(data.quizzes) ? data.quizzes : Object.values(data.quizzes)[0],
          wrongIds: data.wrongIds || clinicData.value?.wrongIds || [],
          is_mastered: data.is_mastered || false,
          quiz_results: data.quiz_results || []
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log("✅ GAS 存檔成功：", result.message);
    } else {
      // 🚩 如果 GAS 報 ReferenceError，這裡會抓到並顯示
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("❌ 存檔請求失敗:", error);
    showToast(`同步失敗: ${error.message}`, 'error');
  } finally {
    loading.value = false;
    uploadStatus.value = "";
  }
};

const loadCachedClinicData = () => {
  if (typeof window === 'undefined') return;
  try {
    const cacheKey = `clinic_${selectedSubject.value}_${selectedTitle.value}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.title === selectedTitle.value) {
        clinicData.value = parsed;
        practiceQuizzes.value = parsed.quizzes || [];
        isTitleDiagnosed.value = true;
        return;
      }
    }
    clinicData.value = null;
    practiceQuizzes.value = [];
    isTitleDiagnosed.value = false;
  } catch (e) {
    console.error("快取讀取失敗:", e);
  }
};

// 🚩 統一監控：科目或卷別變動時觸發讀取
let debounceTimer = null;

const handleResetQuiz = () => {
  userAnswers.value = {};
  if (clinicData.value) {
    clinicData.value.is_mastered = false;
  }
  nextTick(() => {
    scrollToFirstQuiz();
  });
};


// 🚩 核心：讓 AI 重新出題 (簡化版)
const handleRegenerateQuizzes = async () => {
  // 1. 重置 UI 狀態
  userAnswers.value = {}; 
  
  try {
    // 2. 呼叫診斷邏輯 (force = true)
    // 存檔動作已經內建在 handleStartDiagnosis 裡了，這裡不需要再寫 saveDiagnosisToSheet
    await handleStartDiagnosis(true); 

    // 3. 強制切換到最新版本 (這部分保留，確保前端 UI 選中最新 Tab)
    const vKeys = Object.keys(clinicData.value.quizzes);
    currentVersion.value = vKeys[vKeys.length - 1];

    showToast(`新挑戰 ${currentVersion.value} 已同步至雲端`, 'success');

  } catch (error) {
    console.error("生成失敗:", error);
    showToast('同步失敗，請檢查網路', 'error');
  } 
};

const scrollToFirstQuiz = () => {
  const el = document.getElementById('quiz-top');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const switchVersion = (verKey) => {
  if (currentVersion.value === verKey) return;
  currentVersion.value = verKey;
  practiceQuizzes.value = clinicData.value.quizzes[verKey] || [];
  const savedResults = clinicData.value.quiz_results?.[verKey] || [];
  
  if (savedResults.length > 0) {
    const restored = {};
    savedResults.forEach((res, idx) => {
      restored[idx] = {
        selected: res.selected,
        isCorrect: res.isCorrect,
        isWrong: res.isWrong
      };
    });
    userAnswers.value = restored;
  } else {
    userAnswers.value = {};
  }
  nextTick(() => {
    const el = document.getElementById('quiz-top');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  showToast(`已切換至歷程版本 ${verKey}`, 'info');
};

// --- 以下保留你原始代碼中重複的 Watcher 邏輯 ---

// --- 🚩 1. 處理 URL 參數與學生資料初始化 ---
watch(() => route.query, () => handleIncomingQuery(), { deep: true });

watch(() => userConfig?.student_id, (newId) => {
  if (newId) fetchStudentData();
}, { immediate: true });

// --- 🚩 2. 選單自動校正器 (核心修復) ---
// 當題庫載入或科目切換導致 availableTitles 變動時，確保 selectedTitle 合法
watch(availableTitles, (newOptions) => {
  if (!newOptions.includes(selectedTitle.value)) {
    console.log("🎯 選項不匹配，重置為：全部卷別");
    selectedTitle.value = '全部卷別';
  }
}, { immediate: true });

// --- 🚩 3. 數據同步監聽器 (防抖唯一入口) ---
// 這裡刪除原本重複的 watch(selectedSubject) 和 watch([sub, tit])
watch([selectedSubject, selectedTitle], async ([newSub, newTitle], [oldSub, oldTitle]) => {
  // 門禁：正在分析或資料不齊時不抓取
  if (isAnalyzing.value || !newSub || !newTitle) return;

  // 防抖處理：避免頻繁切換科目時轟炸後端 API
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    // 預載快取，提升體感速度
    loadCachedClinicData(); 

    loading.value = true;
    uploadStatus.value = `正在讀取 ${newSub} - ${newTitle} 診斷紀錄...`;

    try {
      // 🚩 調用你修正後的 fetchTargetDiagnosis
      await fetchTargetDiagnosis(); 
    } catch (error) {
      console.error("同步失敗:", error);
    } finally {
      loading.value = false;
      uploadStatus.value = "";
    }
  }, 450); // 給選單連動留出一點緩衝
});

// --- 🚩 4. Tab 切換體感 (選擇性保留) ---
watch(activeTab, async () => {
  loading.value = true;
  uploadStatus.value = "讀取報告細節...";
  await new Promise(resolve => setTimeout(resolve, 300));
  loading.value = false;
});

onMounted(async () => {
  const auth = getValidConfig();
  if (!auth) return; 

  handleIncomingQuery(); // 解析 URL
  await fetchStudentData(true); // 抓題庫
  
  // 🚩 手動傳入參數，確保這一次執行是穩定且正確的
  fetchTargetDiagnosis({
    subject: selectedSubject.value,
    title: selectedTitle.value
  });
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-\[loading_2s_infinite\] {
  animation: loading 2s linear infinite;
}

/* 動畫進入與離開的過程 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 500px; /* 給一個足夠大的高度 */
  overflow: hidden;
}

/* 動畫開始進入前 & 離開結束後 的狀態 */
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}


@keyframes progress {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 如果妳沒用 Tailwind 的 spin，補上這個 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 如果你還沒定義 fade-in，可以參考這個 */
.fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}



/*************/
/* 淡入淡出過渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 讓藍色轉圈更順滑的動畫 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 載入小點的跳動感 */
@keyframes bounce {
  0%, 100% { transform: translateY(0); opacity: 0.3; }
  50% { transform: translateY(-4px); opacity: 1; }
}


@keyframes scan {
  0% { top: -10%; opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { top: 110%; opacity: 0; }
}

@keyframes progress {
  0% { transform: scaleX(0); }
  50% { transform: scaleX(0.7); }
  100% { transform: scaleX(1); }
}

/* 讓分析內容進場有微調感 */
.fade-in {
  animation: fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}


/**/
/* 遮罩過渡動畫 */
.overlay-enter-active, .overlay-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.overlay-enter-from, .overlay-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

/* 模擬進度條 */
@keyframes loading {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}

/* 基礎淡入 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scan {
  from { transform: translateY(0); }
  to { transform: translateY(400px); }
}

@keyframes progress {
  0% { transform: scaleX(0); }
  50% { transform: scaleX(0.7); }
  100% { transform: scaleX(1); }
}

.expand-enter-active, .expand-leave-active {
  transition: all 0.5s ease;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.cooling-text {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #d97706; /* 橘黃色警告感 */
}
</style>
