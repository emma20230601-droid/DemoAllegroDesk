<template>
  <div class="max-w-6xl mx-auto py-6 px-4 relative">
    
    <transition name="fade">
      <div v-if="loading || isInitialLoading || isDeleting" class="global-loader-overlay">
        <div class="loader-spinner"></div>
        <div class="loader-text font-mono tracking-[0.3em] uppercase text-blue-600/60">
          {{ uploadStatus || '正在偵測核心弱點...' }}
        </div>
      </div>
    </transition>

    <div class="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar border-b border-gray-50">
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

    <div class="flex gap-8 border-b border-gray-100 mb-8">
      <button v-for="tab in tabOptions" :key="tab.id" @click="activeTab = tab.id"
        :class="['pb-4 text-sm tracking-widest transition-all relative', activeTab === tab.id ? 'text-black font-bold' : 'text-gray-400']">
        {{ tab.name }}
        <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 w-full h-0.5 bg-black"></div>
      </button>
    </div>

    <div v-if="!isInitialLoading">
      <section v-if="activeTab === 'analytics'" class="animate-in fade-in duration-500 space-y-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F8FBFF] p-4 rounded-[24px] border border-[#DEEBFF]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">📊</div>
            <div>
              <h3 class="text-sm font-black text-[#0747A6] tracking-wider">數據視角</h3>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest">Global vs Session Analysis</p>
            </div>
          </div>
          <div class="flex bg-white p-1 rounded-xl border border-gray-100 shadow-inner">
            <button @click="statsViewMode = 'all'" 
              :class="['px-6 py-2 rounded-lg text-[11px] font-black tracking-widest transition-all', 
              statsViewMode === 'all' ? 'bg-[#0747A6] text-white shadow-md' : 'text-gray-400']">全體綜合</button>
            <select v-model="statsViewMode" 
              :class="['ml-1 px-4 py-2 rounded-lg text-[11px] font-black tracking-widest outline-none transition-all cursor-pointer', 
              statsViewMode !== 'all' ? 'bg-[#0747A6] text-white shadow-md' : 'text-gray-400 bg-transparent']">
              <option value="all" disabled>選擇考卷</option>
              <option v-for="opt in formattedDateOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="stat in enhancedStats" :key="stat.label" class="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <span class="text-[10px] text-[#0052CC] font-black uppercase tracking-[0.2em] mb-3 block">{{ stat.label }}</span>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-serif tracking-tighter text-gray-800">{{ stat.value }}</span>
              <span v-if="stat.unit" class="text-[10px] text-gray-400 font-bold uppercase">{{ stat.unit }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="md:col-span-2 space-y-6">
            <div class="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <h3 class="text-sm font-black tracking-[0.2em] text-gray-900 uppercase mb-3">
                核心領域掌握度診斷
              </h3>

              <p class="text-[13px] font-medium leading-relaxed text-blue-600/80 mb-10 pb-4 border-b border-gray-50">
                本數據反映各觀念的掌握程度。100% 代表已完全精通；數值越高，代表該項目的知識防護網越穩固，能有效避免在考試中出錯。
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                <div v-for="cat in categoryAnalysis" :key="cat.category" class="group">
                  <div class="flex justify-between items-end mb-4">
                    <div class="flex flex-col">
                      <span class="text-[11px] font-bold uppercase tracking-widest opacity-70 mb-1" :style="{ color: categoryColors[cat.category] }">
                        {{ cat.level }}
                      </span>
                      <span class="text-base font-black" :style="{ color: categoryColors[cat.category] }">
                        {{ cat.category }}
                      </span>
                    </div>
                    
                    <div class="text-right">
                      <span class="text-[11px] text-gray-400 mr-2 font-serif italic block sm:inline">Fix Rate</span>
                      <span class="text-2xl font-serif italic font-black leading-none" :style="{ color: categoryColors[cat.category] }">
                        {{ 100 - cat.errorRate }}%
                      </span>
                    </div>
                  </div>

                  <div class="h-3 w-full bg-gray-50 rounded-full overflow-hidden p-[2px] border border-gray-100">
                    <div class="h-full rounded-full transition-all duration-1000 shadow-inner" 
                        :style="{ width: (100 - cat.errorRate) + '%', backgroundColor: categoryColors[cat.category] }">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="statsViewMode === 'all'" class="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm h-[450px]">
              <Line v-if="lineChartData.labels.length > 0" :data="lineChartData" :options="chartOptions" />
            </div>
          </div>

          <div class="bg-[#EBF5FF]/50 p-10 rounded-[40px] border border-[#D1E9FF] relative overflow-hidden">
            <span class="text-xs font-black text-[#0052CC] uppercase tracking-[0.2em] block mb-6">AI 學習導航</span>
            <p class="text-base text-gray-800 leading-relaxed font-semibold italic mb-10">
              "{{ masteryComment }}"
            </p>
 <button 
  @click="activeTab = 'review'" 
  class="w-full bg-white border border-[#D1E9FF] py-5 rounded-2xl text-[13px] font-black text-[#0052CC] shadow-[0_4px_12px_rgba(0,82,204,0.08)] hover:shadow-[0_8px_20px_rgba(0,82,204,0.15)] hover:-translate-y-1 hover:bg-[#0052CC] hover:text-white transition-all duration-300 active:scale-95 active:translate-y-0 active:shadow-inner flex items-center justify-center gap-2 group"
>
  <span>重點回顧</span>
  <span class="transition-transform duration-300 group-hover:translate-x-1">→</span>
</button>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'review'" class="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4">
        <div class="mb-6 flex items-center justify-between p-4 bg-white rounded-[24px] border border-blue-50 shadow-sm">
          <div class="flex items-center gap-4 pl-2">
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" :checked="selectedForPrint.length === sortedFilteredQuestions.length && sortedFilteredQuestions.length > 0" @change="toggleAllSelection" class="w-6 h-6 rounded-lg border-2 border-blue-100 checked:bg-[#0747A6] appearance-none cursor-pointer">
              <span class="text-[#0747A6] text-[11px] font-black uppercase tracking-widest">全選目前錯題</span>
            </label>
            <span class="text-gray-400 text-[10px] uppercase font-bold tracking-widest">已選取 <span class="text-[#0747A6] text-sm">{{ selectedForPrint.length }}</span> 題</span>
          </div>
          <button @click="generateWrongQuestionsPDF" class="bg-[#F0F7FF] text-[#0747A6] border border-[#DEEBFF] px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[#0747A6] hover:text-white transition-all shadow-sm">
            <span class="text-sm">🖨️</span><span class="text-[10px] font-black uppercase tracking-widest">產生黑白複習單</span>
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">卷別:</span>
            <select v-model="statsViewMode" class="bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold text-[#0747A6] outline-none">
              <option value="all">全部</option>
              <option v-for="opt in formattedDateOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <button v-if="statsViewMode !== 'all'" @click="handleConfirmDelete" class="ml-1 p-2 text-gray-300 hover:text-rose-500 transition-all hover:scale-110" title="刪除此卷別">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div class="flex items-center gap-2 border-l border-gray-100 pl-4">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">領域:</span>
            <select v-model="selectedCategory" class="bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold text-[#0747A6] outline-none">
              <option value="">所有領域</option>
              <option v-for="(color, cat) in categoryColors" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <button @click="showOnlyWrong = !showOnlyWrong" 
            class="ml-auto px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all border"
            :class="showOnlyWrong ? 'bg-rose-500 text-white' : 'bg-white text-gray-400 border-gray-100'">
            {{ showOnlyWrong ? '顯示全部' : '只顯示錯題 ⚠️' }}
          </button>
        </div>

       <div v-for="item in sortedFilteredQuestions" :key="item.id" 
  class="rounded-[40px] border flex flex-col overflow-hidden mb-12 transition-all duration-300 shadow-sm bg-white" 
  :class="checkMastery(item) === 'FALSE' ? 'border-yellow-200' : 'border-gray-100'">
  
  <div v-if="item.image_url" 
    class="w-full cursor-zoom-in bg-gray-50/30 flex items-center justify-center border-b border-gray-100" 
    @click="zoomImage(item.image_url)">
    <img :src="item.image_url" class="w-full h-auto object-contain max-h-[600px] p-4" />
  </div>

  <div class="px-8 py-6 flex flex-wrap md:flex-nowrap items-center gap-4 bg-gray-50/50 border-b border-gray-50">
    <div class="flex items-center gap-3">
       <span class="bg-[#0747A6] px-3 py-1.5 rounded-xl text-white font-black text-[11px] tracking-widest uppercase shrink-0">
          {{ formatQuestionDisplay(item.question_key) }}
       </span>
       <input type="checkbox" :value="item.id" v-model="selectedForPrint" class="w-6 h-6 border-2 border-blue-100 rounded-lg appearance-none checked:bg-[#0747A6] cursor-pointer">
    </div>

    <div class="flex-1 flex gap-4">
      <div class="flex-1 flex items-center gap-3 p-3 rounded-2xl border bg-white" :class="checkMastery(item) === 'FALSE' ? 'border-rose-100' : 'border-gray-100'">
        <span class="text-[10px] font-black text-gray-400 uppercase shrink-0 w-10">Your</span>
        <input v-model="item.user_answer" @change="updateSingleItem(item)" 
          class="bg-transparent font-black text-lg outline-none w-full"
          :class="checkMastery(item) === 'FALSE' ? 'text-rose-500' : 'text-[#0747A6]'"/>
      </div>
      
      <div class="flex-1 flex items-center gap-3 p-3 rounded-2xl border border-emerald-100 bg-emerald-50/30">
        <span class="text-[10px] font-black text-emerald-600 uppercase shrink-0 w-12">Correct</span>
        <input v-model="item.correct_answer" @change="updateSingleItem(item)" 
          class="bg-transparent font-black text-lg text-emerald-700 outline-none w-full"/>
      </div>
    </div>
  </div>

<div class="px-10 py-10 border-b border-gray-50" :class="checkMastery(item) === 'FALSE' ? 'bg-[#FFFDF5]' : 'bg-white'">
  <div class="flex items-center gap-2 mb-4">
    <div class="w-1.5 h-6 bg-[#0747A6] rounded-full"></div> <label class="text-[12px] text-[#0747A6] font-black uppercase tracking-[0.2em] opacity-70">Focus Point & Knowledge</label>
  </div>
  
  <textarea v-model="item.knowledge_point" @change="updateSingleItem(item)" 
    class="w-full text-2x font-black bg-transparent outline-none focus:text-[#0747A6] transition-all leading-[1.4] placeholder:text-gray-200" 
    rows="5" 
    placeholder="點擊此處輸入更詳細的核心概念...">
  </textarea>
</div>

  <div class="px-10 py-10 bg-white">
    <div class="relative group">
      <div class="absolute -top-3 left-6 px-4 py-1 bg-white flex items-center gap-3 border border-blue-100 rounded-full shadow-sm z-10">
        <span class="text-[10px] text-blue-700 font-black uppercase tracking-[0.15em]">AI Logic Diagnosis</span>
        <button @click="reAnalyzeItem(item)" :disabled="item.isAnalyzing" class="text-blue-400 hover:text-blue-600 transition-colors">
          <span v-if="!item.isAnalyzing" class="text-xs">🔄</span>
          <span v-else class="animate-spin block text-xs">⏳</span>
        </button>
      </div>
      <textarea v-model="item.ai_explanation" @change="updateSingleItem(item)" 
        class="w-full p-8 pt-10 bg-blue-50/10 rounded-[40px] border border-blue-50/50 text-base leading-relaxed text-gray-700 outline-none focus:bg-white transition-all min-h-[160px]"
        :placeholder="item.isAnalyzing ? 'AI 正在分析中...' : '解析內容...'"
        style="resize: none;"></textarea>
        <div class="flex flex-wrap items-center gap-y-5 gap-x-3 mt-8 pt-6 border-t border-gray-100">
  
  <div class="flex items-center gap-2 mr-2">
    
    <span class="text-[11px] font-black text-gray-400 uppercase tracking-widest">🛡️ 驗證解析準確度</span>
  </div>

  <div class="relative group">
    <button @click="handleAIQuery('chatgpt', item)" 
      class="flex items-center gap-2 px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[11px] font-black text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all duration-300">
      🤖 ChatGPT
    </button>
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-[10px] font-black rounded-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none transition-all duration-300 shadow-xl whitespace-nowrap z-30">
      邏輯解觀念
      <div class="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-indigo-200"></div>
      <div class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-white translate-y-[-1px]"></div>
    </div>
  </div>

  <div class="relative group">
    <button @click="handleAIQuery('perplexity', item)" 
      class="flex items-center gap-2 px-4 py-2 bg-emerald-50/30 border border-emerald-100 rounded-xl text-[11px] font-black text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all duration-300">
      ⚡️ Perplexity
    </button>
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 text-[10px] font-black rounded-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none transition-all duration-300 shadow-xl whitespace-nowrap z-30">
      精準查來源
      <div class="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-emerald-200"></div>
      <div class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-white translate-y-[-1px]"></div>
    </div>
  </div>

  <div class="relative group">
    <button @click="handleAIQuery('you', item)"
      class="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-black text-gray-600 hover:bg-gray-800 hover:text-white transition-all duration-300">
      📦 You.com
    </button>
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-[10px] font-black rounded-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none transition-all duration-300 shadow-xl whitespace-nowrap z-30">
      整合圖文快
      <div class="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-300"></div>
      <div class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-white translate-y-[-1px]"></div>
    </div>
  </div>

  <div class="relative group">
    <button @click="openGoogleAI(item)" 
      class="flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 rounded-xl text-[11px] font-black text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300">
      <span class="text-sm">🔍</span> Google
    </button>
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 text-[10px] font-black rounded-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none transition-all duration-300 shadow-xl whitespace-nowrap z-30">
      最快查定義
      <div class="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-blue-200"></div>
      <div class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-white translate-y-[-1px]"></div>
    </div>
  </div>

</div>
      </div>

    <div class="flex justify-between items-center mt-6 px-4">
      <span class="text-[11px] font-bold text-gray-300 uppercase tracking-widest">{{ formatDate(item.date) }}</span>
      <button @click="deleteItem(item.id, formatQuestionDisplay(item.question_key))" class="text-gray-200 hover:text-rose-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
</div>

      </section>

      <section v-else-if="activeTab === 'upload'" class="max-w-2xl mx-auto space-y-8">
        <div class="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <div class="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 mb-4">
            <button @click="gradingMode = 'ai'" :class="['flex-1 py-3 rounded-xl text-[11px] font-black tracking-widest transition-all', gradingMode === 'ai' ? 'bg-white text-[#0747A6] shadow-sm' : 'text-gray-400']">🤖 AI 自動批改</button>
            <button @click="gradingMode = 'manual'" :class="['flex-1 py-3 rounded-xl text-[11px] font-black tracking-widest transition-all', gradingMode === 'manual' ? 'bg-white text-[#0747A6] shadow-sm' : 'text-gray-400']">📝 已批改上傳</button>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div v-for="(img, idx) in imageFiles" :key="idx" class="relative aspect-square rounded-2xl overflow-hidden border">
              <img :src="img" class="w-full h-full object-cover" />
              <button @click="removeImage(idx)" class="absolute top-2 right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs">✕</button>
            </div>
            <div @click="$refs.fileInput.click()" class="border-2 border-dashed rounded-2xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400">
              <input type="file" ref="fileInput" accept="image/*" capture="environment" class="hidden" @change="prepareToCrop" />
              <span class="text-2xl">+</span><span class="text-[10px] font-black uppercase">拍照上傳</span>
            </div>

          </div>
          <div class="space-y-4">
            <input type="date" v-model="form.test_date" class="w-full p-4 bg-[#F8FBFF] border border-[#DEEBFF] rounded-2xl outline-none" />
            <input v-model="form.question_key" placeholder="卷別名稱" class="w-full border-b p-3 outline-none" />
            <textarea v-model="form.knowledge_point" placeholder="備註..." class="w-full p-4 bg-gray-50 rounded-2xl h-24 outline-none"></textarea>
          </div>
          <button @click="saveRecord" :disabled="loading || imageFiles.length === 0" class="w-full py-5 rounded-[24px] font-black text-[11px] tracking-[0.4em] uppercase bg-[#F0F7FF] text-[#0747A6] hover:bg-[#0747A6] hover:text-white transition-all">
            {{ loading ? 'Analyzing...' : 'Save To Cloud →' }}
          </button>
        </div>
      </section>
      <div v-if="isCropping" class="fixed inset-0 z-[100] bg-black flex flex-col">
  <div class="flex justify-between items-center p-4 bg-black/50 backdrop-blur-md">
    <button @click="cancelCrop" class="text-white text-sm font-bold">取消</button>
    <div class="text-white text-xs font-black tracking-widest uppercase">精確裁切單題</div>
    <button @click="confirmCrop" class="bg-[#0747A6] text-white px-6 py-2 rounded-full text-xs font-black">確認裁切</button>
  </div>
  
  <div class="flex-grow overflow-hidden relative">
    <cropper
      ref="cropperRef"
      class="h-full w-full"
      :src="rawImage"
      :stencil-props="{ aspectRatio: NaN }" 
    />
  </div>
  
  <div class="p-6 bg-black/50 text-white/60 text-[10px] text-center italic">
    請拖動方框對準「題號、題目、答案與批改痕跡」
  </div>
</div>


    </div>

    <div v-if="zoomedImageUrl" @click="zoomedImageUrl = null" class="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out">
      <img :src="zoomedImageUrl" class="max-w-full max-h-full object-contain" />
    </div>

    <transition name="notification">
      <div v-if="alertConfig.show" class="fixed top-8 left-1/2 -translate-x-1/2 z-[400] w-[90%] max-w-md pointer-events-none">
        <div class="bg-white/80 backdrop-blur-xl border p-5 rounded-[28px] shadow-2xl flex items-start gap-4" :class="{'border-emerald-100': alertConfig.type === 'success', 'border-rose-100': alertConfig.type === 'error'}">
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

    <transition name="slide-fade">
      <div v-if="syncSuccess" class="fixed top-5 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
        <div class="bg-emerald-50/90 backdrop-blur-sm border border-emerald-100 px-6 py-2 rounded-full shadow-sm flex items-center gap-2">
          <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span class="text-xs font-bold text-emerald-700 tracking-wider">執行成功，資料已同步</span>
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="deleteModal.show" class="fixed inset-0 z-[600] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="deleteModal.show = false"></div>
        <div class="relative bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 transform transition-all border border-slate-100">
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
              <span class="text-rose-600 text-xl">🗑️</span>
            </div>
            <h3 class="text-lg font-black text-gray-800 mb-2">確認刪除此測驗？</h3>
            <p class="text-xs text-gray-500 mb-6 leading-relaxed">
              刪除後「<span class="text-gray-800 font-bold">{{ deleteModal.session?.topic }}</span>」的紀錄將無法恢復。
            </p>
          </div>
          <div class="flex space-x-3">
            <button @click="deleteModal.show = false" class="flex-1 px-4 py-3 rounded-2xl text-[11px] font-bold tracking-widest uppercase text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all">取消</button>
            <button @click="executeDelete" :disabled="isDeleting" class="flex-1 px-4 py-3 rounded-2xl text-[11px] font-bold tracking-widest uppercase text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all">
              {{ isDeleting ? '處理中...' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject, watch } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler } from 'chart.js';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

// 狀態管理
const isCropping = ref(false);
const rawImage = ref(null);
const cropperRef = ref(null);

// 第一步：選取檔案後，不存入列表，而是開啟裁切器
const prepareToCrop = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    rawImage.value = e.target.result;
    isCropping.value = true;
    event.target.value = ''; 
  };
  reader.readAsDataURL(file);
};

// 第二步：使用者點擊「確認裁切」
const confirmCrop = () => {
  const { canvas } = cropperRef.value.getResult();
  if (canvas) {
    // 將裁切後的 Base64 圖片推入 imageFiles 陣列
    const croppedImage = canvas.toDataURL('image/jpeg');
    imageFiles.value.push(croppedImage);
    
    // 裁切完一題後，關閉裁切視窗，回到上傳分頁
    isCropping.value = false;
    rawImage.value = null;
  }
};

const cancelCrop = () => {
  isCropping.value = false;
  rawImage.value = null;
};

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler);

// --- 🖨️ 錯題列印功能 (完整保留) ---
const selectedForPrint = ref([]);

const toggleAllSelection = () => {
  if (selectedForPrint.value.length === sortedFilteredQuestions.value.length) {
    selectedForPrint.value = [];
  } else {
    selectedForPrint.value = sortedFilteredQuestions.value.map(q => q.id);
  }
};

const generateWrongQuestionsPDF = () => {
  if (selectedForPrint.value.length === 0) {
    showAlert("操作提示", "請先勾選想要列印的題目", "info");
    return;
  }

  const sessionData = JSON.parse(localStorage.getItem('allegro_auth_session') || '{}');
  const studentName = sessionData.userName || "學生";
  const printItems = questions.value.filter(q => selectedForPrint.value.includes(q.id));
  const printWindow = window.open('', '_blank');

  const selectedExamLabel = statsViewMode.value === 'all' 
    ? '全部考卷' 
    : (formattedDateOptions.value.find(opt => opt.value === statsViewMode.value)?.label || statsViewMode.value);

  let htmlContent = `
    <html>
    <head>
      <title>錯題複習本</title>
      <style>
        @page { margin: 0; } 
        body { 
          margin: 0; padding: 0;
          font-family: "Microsoft JhengHei", sans-serif;
          line-height: 1.4; color: #000;
        }
        .page-header-space { height: 1.5cm; }
        .print-container { padding: 0 2cm 1.5cm 2cm; }
        table { width: 100%; border-collapse: collapse; }
        thead { display: table-header-group; }
        .header { 
          display: flex; justify-content: space-between; align-items: flex-end;
          border-bottom: 1.5px solid #000; padding-bottom: 8px; margin-bottom: 25px; 
          padding-top: 1.5cm; 
        }
        .header h1 { margin: 0; font-size: 18pt; letter-spacing: 2px; }
        .header .info-meta { text-align: right; font-size: 9pt; color: #444; }
        .item { margin-bottom: 25px; page-break-inside: avoid; border-bottom: 1px dashed #eee; padding-bottom: 20px; }
        .q-title { font-weight: bold; font-size: 11pt; margin-bottom: 6px; display: flex; justify-content: space-between; }
        .q-content { white-space: pre-wrap; margin-bottom: 12px; font-size: 10.5pt; color: #222; }
        
        /* 圖片樣式優化 */
        img { 
          display: block; 
          max-width: 100%; 
          max-height: 10cm; 
          margin: 15px auto; 
          border: 1px solid #eee; 
          border-radius: 4px;
        }

        .ans-box { border: 1px solid #333; padding: 8px 12px; margin: 10px 0; display: inline-flex; gap: 25px; font-size: 9.5pt; background: #fafafa; }
        .explanation { margin-top: 8px; font-size: 9pt; color: #555; padding-left: 10px; border-left: 3px solid #eee; }
        .note-area { margin-top: 12px; border: 1px solid #f0f0f0; height: 60px; position: relative; }
        .note-label { font-size: 8pt; color: #999; position: absolute; top: 5px; left: 5px; }
      </style>
    </head>
    <body>
      <div class="print-container">
        <table>
          <thead><tr><td><div class="page-header-space"></div></td></tr></thead>
          <tbody>
            <tr>
              <td>
                <div class="header">
                  <div>
                    <h1>${selectedSubject.value} 錯題清單</h1>
                    <span style="font-size: 11pt; font-weight: bold;">${selectedExamLabel}</span>
                  </div>
                  <div class="info-meta">
                    學生：${studentName}<br>
                    產生日期：${new Date().toLocaleDateString()}
                  </div>
                </div>
                ${printItems.map((item, index) => `
                  <div class="item">
                    <div class="q-title">
                      <span>第 ${index + 1} 題 <small style="font-weight:normal; color:#666;">[${item.category}]</small></span>
                      <span style="font-size: 8pt; font-weight: normal; color: #999;"> ${formatDate(item.date).split(' ')[0] || ''}</span>
                    </div>
                    <div class="q-content">${item.knowledge_point || '無內容'}</div>
                    
                    ${item.image_url ? `<img src="${item.image_url}">` : ''}

                    <div class="ans-box">
                      <span>我的答案：<b>${item.user_answer || '未答'}</b></span>
                      <span>正確答案：<b>${item.correct_answer || '未提供'}</b></span>
                    </div>
                    <div class="explanation"><b>AI 解析：</b>${item.ai_explanation || '尚無解析'}</div>
                    <div class="note-area"><span class="note-label">筆記：</span></div>
                  </div>
                `).join('')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

// --- 核心狀態管理---
const subjectConfigs = inject('subjectConfigs');
const userConfig = inject('userConfig'); 
const selectedSubject = ref('國文'); 
const latestScanResults = ref([]);
const loading = ref(false);
const isInitialLoading = ref(true);
const uploadStatus = ref('正在翻找紀錄...');
const activeTab = ref('analytics');
const statsViewMode = ref('all');
const imageFiles = ref([]);
const questions = ref([]);
const selectedCategory = ref(''); 
const showOnlyWrong = ref(false); 
const zoomedImageUrl = ref(null);
const syncSuccess = ref(false);
const gradingMode = ref('ai');

const form = reactive({ 
  question_key: '', 
  knowledge_point: '', 
  test_date: new Date().toISOString().split('T')[0] 
});

const parseQuestionKey = (key) => {
  if (!key) return { big: '', small: '999', rawSmall: '999' };

  // 1. 匹配大題 (一, 二, 三...) 與 小題 (1, 2, 3...)
  const match = key.match(/第\s*([一二三四五六七八九十]+)-([\d\-\(\)]+)\s*題/);

  if (match) {
    const bigTitle = match[1]; 
    const smallTitle = match[2]; 
    
    const firstNum = smallTitle.match(/\d+/)?.[0] || '999';

    return {
      big: bigTitle,
      small: smallTitle,
      sortValue: parseInt(firstNum)
    };
  }

  const fallback = key.match(/(\d+)(?!.*\d)/);
  return { big: '', small: fallback ? fallback[1] : '999', sortValue: fallback ? parseInt(fallback[1]) : 999 };
};

const formatQuestionDisplay = (key) => {
  const { big, small } = parseQuestionKey(key);
  if (!big) return `No. ${small}`;
  return `第${big}大題 No. ${small}`;
};

const extractQuestionNum = (key) => {
  const { sortValue } = parseQuestionKey(key);
  return sortValue;
};

const zoomImage = (url) => { zoomedImageUrl.value = url; };

const checkMastery = (item) => {
  const currentAns = String(item.user_answer || '').trim().toLowerCase();
  const correctAns = String(item.correct_answer || '').trim().toLowerCase();

  if (currentAns !== '' || correctAns !== '') {
    return currentAns === correctAns ? 'TRUE' : 'FALSE';
  }

  if (item.is_mastered !== undefined) {
    const aiStatus = String(item.is_mastered).toUpperCase();
    return aiStatus === 'TRUE' ? 'TRUE' : 'FALSE';
  }

  return 'FALSE';
};

// --- 資料同步---
const fetchData = async (forceLoading = false) => {
  if (loading.value && !forceLoading) return;

  // 1. 門禁工具檢查
  const { getValidConfig } = useAuth();
  const config = getValidConfig();

  if (!config) {
    loading.value = false;
    isInitialLoading.value = false;
    return;
  }

  // 2. 統一變數來源
  const studentId = config.student_id;
  const sheetId = config.sheet_id;
  const tabName = config.userName; 
  const gasUrl = localStorage.getItem('user_gas_url');

  // 3. 安全檢查
  if (!sheetId || !tabName || !gasUrl) {
    console.warn("[Fetch] 缺少關鍵參數或 GAS URL，取消讀取");
    isInitialLoading.value = false;
    return;
  }

  loading.value = true;

  // --- 4. 原有的監控邏輯 ---
  // 監控科目切換
  watch(selectedSubject, (newSub) => {
    loading.value = true;
    uploadStatus.value = newSub === 'All' ? '正在整合全科紀錄...' : `正在讀取 ${newSub} 檔案...`;
    setTimeout(() => { loading.value = false; }, 450);
  });

  // 原有的分頁切換邏輯
  watch(activeTab, (newTab) => {
    loading.value = true;
    const statusMap = {
      'analytics': '正在為你準備學習報表...',
      'review': '正在翻閱你的錯題紀錄...',
      'upload': '正在準備上傳新題目...',
      'del': '正在更新你的錯題本，請稍候...'
    };
    uploadStatus.value = statusMap[newTab] || '數據同步中...';
    setTimeout(() => { loading.value = false; }, 450);
  });

  // --- 5. 執行請求---
  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'fetch_data',
        sheetName: tabName // 讀取該學生的分頁
      })
    });
    
    const result = await response.json();
    
    if (result && result.success) {
      questions.value = result.data || [];
    } else {
      console.error("GAS 報錯:", result.error);
    }
  } catch (err) { 
    console.error("Fetch Error:", err); 
  } finally { 
    loading.value = false; 
    isInitialLoading.value = false; 
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  
  // 檢查是否為有效日期
  if (isNaN(date.getTime())) return dateStr; 

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  
  return `${y}/${m}/${d}`; // 輸出格式：2026/03/17
};

// --- ✨ 增加監聽器 ---
watch(() => userConfig?.sheet_id, (newVal) => {
  if (newVal && questions.value.length === 0) {
    fetchData();
  }
}, { immediate: true });

const updateSingleItem = async (item) => {
  if (!item || !item.id) return;

  // 1. 💡 門禁檢查：確保拿到正確的分頁 
  const { getValidConfig } = useAuth();
  const config = getValidConfig();
  if (!config) return;

  const gasUrl = localStorage.getItem('user_gas_url');
  const tabName = config.userName; 

  try {
    const res = await fetch(gasUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'update', 
        sheetName: tabName,
        updates: [{
          id: String(item.id),
          user_answer: item.user_answer,
          correct_answer: item.correct_answer,
          knowledge_point: item.knowledge_point,
          ai_explanation: item.ai_explanation,
          category: item.category,
          is_mastered: String(item.user_answer === item.correct_answer).toUpperCase()
        }]
      })
    });

    const result = await res.json();
    if (result.success) {
      syncSuccess.value = true;
      setTimeout(() => { syncSuccess.value = false; }, 2000);
    }
  } catch (err) {
    console.error("GAS Update Error:", err);
  }
};

// --- 計算屬性---
const currentStatsData = computed(() => {
  // 1. 基礎檢查：沒資料就直接回傳
  const allData = questions.value || [];
  if (allData.length === 0) return [];

  // 2. 取得科目配置
  const currentConfig = subjectConfigs?.[selectedSubject.value];
  if (!currentConfig) {
    return [];
  }

  // 3. 第一層過濾：篩選屬於該科目的類別 (Category)
  const currentCats = (currentConfig.cats || []).map(c => String(c).trim().toLowerCase());
  
  let filtered = allData.filter(q => {
    const qCat = String(q.category || '').trim().toLowerCase();
    return currentCats.includes(qCat);
  });

  // 4. 第二層過濾：根據下拉選單 (statsViewMode) 篩選特定的考卷
  if (statsViewMode.value === 'all') return filtered;

  const targetKey = String(statsViewMode.value);
  return filtered.filter(q => {
    const rawDate = String(q.date || '').trim().split(' ')[0].replace(/\//g, '-');
    if (!rawDate) return false;

    const isQuiz = String(q.id || '').toLowerCase().includes('quiz');
    
    const cleanTitle = String(q.title || rawDate)
      .replace(/\s*[-\s]*[\(\（](隨堂測驗|練習卷)[\)\）]/g, '')
      .trim();

    const currentKey = `${isQuiz ? 'q' : 'n'}:${rawDate}:${cleanTitle}`;
    
    return currentKey === targetKey;
  });
});

const enhancedStats = computed(() => {
  const d = currentStatsData.value;
  const total = d.length;
  const mastered = d.filter(q => checkMastery(q) === 'TRUE').length;
  return [
    { label: '累計挑戰', value: total, unit: '題' },
    { label: '掌握程度', value: total ? Math.round((mastered/total)*100) : 0, unit: '%' },
    { label: '待複習', value: total - mastered, unit: '題' },
    { label: '測驗天數', value: [...new Set(d.map(q => q.date?.split(' ')[0]))].filter(x=>x).length, unit: '天' }
  ];
});

const categoryAnalysis = computed(() => {
  const groups = {};
  const currentCats = subjectConfigs[selectedSubject.value]?.cats || [];
  
  currentCats.forEach(c => { 
    groups[c] = { total: 0, masteredCount: 0 }; 
  });

  const data = currentStatsData.value || [];
  data.forEach(q => {
    const catName = q.category ? String(q.category).trim() : '';
    if (groups[catName]) {
      groups[catName].total++;
      if (String(q.is_mastered).trim().toUpperCase() === 'TRUE') {
        groups[catName].masteredCount++;
      }
    }
  });

  return Object.keys(groups)
    .map(c => {
      const t = groups[c].total;
      const m = groups[c].masteredCount;

      const recoveryRate = t > 0 ? Math.round((m / t) * 100) : 0;
      
      return {
        category: c,
        total: t,
        masteredCount: m,
        errorRate: 100 - recoveryRate, 
        level: recoveryRate === 100 ? '已清空' : (recoveryRate > 50 ? '修復中' : '待處理')
      };
    })
    .filter(item => item.total > 0)
    .sort((a, b) => a.errorRate - b.errorRate);
});

const sortedFilteredQuestions = computed(() => {
  return currentStatsData.value.filter(q => {
    return (!selectedCategory.value || q.category === selectedCategory.value) &&
           (!showOnlyWrong.value || checkMastery(q) === 'FALSE');
  }).sort((a, b) => {
    const dateA = String(a.date || '').split(' ')[0];
    const dateB = String(b.date || '').split(' ')[0];
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    const numA = parseInt(String(a.id).match(/\d+$/)?.[0] || '0', 10);
    const numB = parseInt(String(b.id).match(/\d+$/)?.[0] || '0', 10);
    return numA - numB;
  });
});

const lineChartData = computed(() => {
  const getCleanDate = (dateStr) => String(dateStr || '').split(' ')[0].replace(/\//g, '-');
  
  const dataForChart = currentStatsData.value;
  
  const dates = [...new Set(dataForChart.map(q => getCleanDate(q.date)))]
    .filter(x => x)
    .sort();

  const currentConfig = subjectConfigs[selectedSubject.value];
  if (!currentConfig || !dates.length) return { labels: [], datasets: [] };

  return {
    labels: dates,
    datasets: currentConfig.cats.map(c => ({
      label: c,
      borderColor: currentConfig.colors[c] || '#CCCCCC',
      backgroundColor: (currentConfig.colors[c] || '#CCCCCC') + '20',
      data: dates.map(d => {
        const group = dataForChart.filter(x => getCleanDate(x.date) === d && x.category === c);
        
        if (group.length === 0) return null; // 該天沒這類題目，回傳 null 讓圖表斷點(spanGaps)處理

        const masteredCount = group.filter(v => checkMastery(v) === 'TRUE').length;
        return Math.round((masteredCount / group.length) * 100);
      }),
      tension: 0.4, 
      spanGaps: true, 
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6
    }))
  };
});
const formattedDateOptions = computed(() => {
  const dateMap = new Map();
  const currentCats = (subjectConfigs[selectedSubject.value]?.cats || []).map(c => String(c).trim());
  
  questions.value.filter(q => currentCats.includes(String(q.category || '').trim()) && q.date && q.id).forEach(q => {
    const rawDate = String(q.date).split(' ')[0].replace(/\//g, '-');
    const isQuiz = String(q.id).toLowerCase().includes('quiz');
    const cleanTitle = String(q.title || rawDate).replace(/\s*[-\s]*[\(\（](隨堂測驗|練習卷)[\)\）]/g, '').trim();
    const uniqueValue = `${isQuiz ? 'q' : 'n'}:${rawDate}:${cleanTitle}`;

    if (!dateMap.has(uniqueValue)) {
      const paperId = getPaperId(q.id);
      dateMap.set(uniqueValue, {
        value: uniqueValue,
        cleanTitle: cleanTitle,
        timestamp: parseInt(paperId.match(/\d+/)?.[0] || '0'),
        isQuiz: isQuiz
      });
    }
  });

  const allOptions = Array.from(dateMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  const titleCounts = {};
  return allOptions.map(opt => {
    const title = opt.cleanTitle;
    if (!titleCounts[title]) titleCounts[title] = 0;
    titleCounts[title]++;
    const hasDuplicates = allOptions.filter(x => x.cleanTitle === title).length > 1;
    const finalLabel = hasDuplicates 
      ? `${title} - (第 ${numberToChinese(titleCounts[title])} 回${opt.isQuiz ? '隨堂' : '練習'})`
      : `${title} - (${opt.isQuiz ? '隨堂測驗' : '練習卷'})`;
    return { value: opt.value, label: finalLabel };
  });
});

function numberToChinese(num) {
  const chinese = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const n = Math.floor(Number(num));
  return (n >= 0 && n <= 10) ? chinese[n] : num;
}

const getPaperId = (id) => {
  if (!id) return '';
  const parts = String(id).split('-');
  return parts.length > 1 ? parts.slice(0, -1).join('-') : id;
};

const onFileSelected = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.src = ev.target.result;
    
    img.onload = () => {
      // --- 圖片壓縮邏輯 ---
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // 1. 設定最大寬度為 1600px
      const MAX_WIDTH = 1600;
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // 2. 轉成 jpeg 格式並設定品質為 0.7 (大幅縮減檔案體積)
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      
      // 3. 存入陣列
      imageFiles.value.push(compressedBase64);

    };
  };
  reader.readAsDataURL(file);
};

const removeImage = (index) => { imageFiles.value.splice(index, 1); };

// --- 監控與生命週期---
watch(selectedSubject, async () => {
  statsViewMode.value = 'all';
  selectedCategory.value = '';
  showOnlyWrong.value = false;
  if (!loading.value) {
    await fetchData(true);
  }
});

onMounted(() => { fetchData(); });

const alertConfig = reactive({ show: false, title: '', message: '', type: 'success' });
const showAlert = (title, message, type = 'success') => {
  alertConfig.title = title; alertConfig.message = message; alertConfig.type = type; alertConfig.show = true;
  setTimeout(() => { alertConfig.show = false; }, 3500);
};

const tabOptions = computed(() => {
  return [
    { id: 'analytics', name: '戰力分析' },
    { id: 'review', name: '檢討回顧' },
    { id: 'upload', name: '考卷掃描' }
  ];
});


const categoryColors = computed(() => {
  const config = subjectConfigs?.[selectedSubject.value];
  if (!config || !config.colors) return {};
  return config.colors;
});


const masteryComment = computed(() => {
  const analysis = categoryAnalysis.value; 
  if (!analysis || analysis.length === 0) return "系統待命：請上傳錯題資料以啟動 AI 戰力分析。";

  const sortedAnalysis = [...analysis].sort((a, b) => (100 - a.errorRate) - (100 - b.errorRate));
  
  const weakest = sortedAnalysis[0];
  const score = 100 - weakest.errorRate;

  // --- 實際且專業的診斷文字 ---

  // 🔴 掌握度極低 (0-50%)
  if (score <= 50) {
    return `核心警訊：你在「${weakest.category}」的掌握度僅有 ${score}%。這顯示基礎完全脫節，這類題目目前對你而言跟盲猜沒兩樣。建議立即停止盲目刷題，先從基礎字義與基礎定義重新扎根。`;
  } 

  // 🟠 及格邊緣 (51-75%)：例如你的文言文 (49%)
  if (score <= 75) {
    return `戰力落後：「${weakest.category}」正處於及格邊緣 (${score}%)。目前的錯誤多半來自於觀念混淆。請點擊「重點回顧」並利用 AI 邏輯診斷功能，釐清題目背後的陷阱邏輯。`;
  }

  // 🟡 穩定區間 (76-90%)
  if (score <= 90) {
    return `精進指引：「${weakest.category}」已有一定水準 (${score}%)，但仍有失誤空間。建議練習時嘗試「反向推導」，確認自己是「真的懂」而不是「憑感覺」。`;
  }

  // 🟢 巔峰狀態 (所有項目都 > 90%)
  return "巔峰診斷：所有核心領域已進入高穩定區。目前的對手只有「粗心」，建議保持手感並將精力分配至其他弱勢學科，維持總分領先。";
});

const saveRecord = async () => {
  if (loading.value || imageFiles.value.length === 0) return;
  
  const { getValidConfig } = useAuth();
  const config = getValidConfig();
  if (!config) return;

  const targetSheetId = config.sheet_id;
  const tabName = config.userName; 

  loading.value = true;

  const compressImage = async (base64Str) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000; 
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
      };
      img.onerror = () => {
          console.error("圖片壓縮失敗");
          resolve(base64Str.split(',')[1] || base64Str); // 失敗就傳原圖
        };
    });
  };

  // 執行壓縮
  const compressedBatch = await Promise.all(
    imageFiles.value.map(img => compressImage(img))
  );

  uploadStatus.value = gradingMode.value === 'ai' ? 'AI 批改中...' : 'AI 診斷中...';

  try {
    const res = await $fetch('/api/assignments', {
      method: 'POST',
      body: { 
        action: 'upload', 
        imageBatch: compressedBatch, 
        subject: selectedSubject.value,
        mode: gradingMode.value,
        userConfig: config 
      }
    }).catch(err => {
      // 1. 取得原始錯誤資訊
      const errorData = err.data || {};
      // 確保即使沒抓到訊息，也有一個基礎字串供比對
      const rawMsg = (errorData.message || err.message || "unknown_error").toLowerCase();
      
      console.error("捕獲到 API 錯誤串:", rawMsg); // 偵錯用

      // 2. 條件判斷
      if (rawMsg.includes('429') || rawMsg.includes('quota')) {
        return { 
          success: false, 
          isQuotaError: true, 
          message: '⚡️ AI 能量耗盡（額度上限），請 1 分鐘後再試。' 
        };
      }

      if (rawMsg.includes('413') || rawMsg.includes('large')) {
        return { 
          success: false, 
          message: '📸 圖片檔案過大，請嘗試減少張數或縮小照片。' 
        };
      }

      // 3. 確保如果以上都不符合，也要有預設訊息
      const finalMsg = errorData.message || err.message || "連線發生異常，請檢查網路或稍後再試";
      
      return { 
        success: false, 
        message: finalMsg 
      };
    });

    // 4. 顯示彈窗
    if (!res.success) {
      const displayMsg = res.message || "辨識程序發生未知錯誤";
      
      if (res.isQuotaError) {
        showAlert("AI 休息中", displayMsg, "warning"); 
      } else {
        showAlert("辨識失敗", displayMsg, "error");
      }
      loading.value = false;
      return;
    }

    if (res.success && res.data) {
      const rowsToSave = res.data.map(item => ({
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        date: form.test_date || new Date().toISOString().split('T')[0],
        scan_date: new Date().toLocaleString(),
        category: item.category || '未分類',
        title: form.question_key || '未命名考卷',
        question_key: `第 ${item.num} 題`,
        correct_answer: item.correct_answer,
        user_answer: item.user_answer || '',
        knowledge_point: item.original_text,
        image_url: item.imageUrl,           
        is_mastered: item.is_mastered ? 'TRUE' : 'FALSE',
        ai_explanation: item.explanation    
      }));

      const gasUrl = localStorage.getItem('user_gas_url');
      
      const gasRes = await fetch(gasUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'append_batch',
          sheetName: tabName,
          data: rowsToSave 
        })
      });

      const gasResult = await gasRes.json(); 
      
      if (gasResult.success) {
        latestScanResults.value = rowsToSave;
        await fetchData(true);
        
        imageFiles.value = [];
        form.question_key = '';
        form.knowledge_point = ''; 
        syncSuccess.value = true;
        activeTab.value = 'review';
        showAlert("儲存成功", `已辨識 ${rowsToSave.length} 題並存入雲端`, "success");
      } else {
        throw new Error(gasResult.message || 'GAS 存檔失敗');
      }
    }
  } catch (err) {
    console.error("Save Record Final Catch:", err);
    showAlert("系統錯誤", "發生未預期的錯誤，請檢查網路後重試。", "error");
  } finally {
    loading.value = false;
  }
};

// --- 1. 刪除相關狀態 ---
const deleteModal = ref({ show: false, session: null });
const isDeleting = ref(false);

// --- 2. 開啟確認視窗 ---
const confirmDelete = (session) => {
  deleteModal.value = { show: true, session };
};

// --- 3. 執行刪除邏輯 ---
const handleConfirmDelete = () => {
  const currentOption = formattedDateOptions.value.find(opt => opt.value === statsViewMode.value);
  
  deleteModal.value = { 
    show: true, 
    session: { 
      topic: currentOption ? currentOption.label : statsViewMode.value,
      sessionId: statsViewMode.value 
    } 
  };
};

const executeDelete = async () => {
  const target = deleteModal.value.session; 
  if (!target) return;

  // 1. 門禁檢查：確保操作者身分合法 
  const { getValidConfig } = useAuth();
  const config = getValidConfig();

  // 如果門禁沒過，直接中斷
  if (!config) {
    deleteModal.value.show = false;
    return;
  }

  isDeleting.value = true;
  activeTab.value = 'del';
  const gasUrl = localStorage.getItem('user_gas_url');

  let targetIds = [];

  if (target.id) {
    // 1. 單題刪除
    targetIds = [String(target.id)];
  } else {
    // 2. 整卷刪除
    const currentViewKey = statsViewMode.value;
    targetIds = questions.value
      .filter(q => {
        const rawDate = String(q.date || '').trim().split(' ')[0].replace(/\//g, '-');
        const isQuiz = String(q.id || '').toLowerCase().includes('quiz');
        const cleanTitle = String(q.title || rawDate)
          .replace(/\s*[-\s]*[\(\（](隨堂測驗|練習卷)[\)\）]/g, '')
          .trim();
        const currentKey = `${isQuiz ? 'q' : 'n'}:${rawDate}:${cleanTitle}`;
        return currentKey === currentViewKey;
      })
      .map(q => String(q.id));
  }

  // 安全檢查
  if (targetIds.length === 0) {
    showAlert('提醒', '找不到對應的題目 ID', 'error');
    deleteModal.value.show = false;
    isDeleting.value = false;
    activeTab.value = 'review'; 
    return;
  }

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'deleteAssignment', 
        sheetName: config.sheet_name, 
        ids: targetIds,               
        studentId: config.student_id  
      })
    });

    const res = await response.json();

    if (res.success) {
      deleteModal.value.show = false; 
      showAlert('刪除成功', `已移除 ${targetIds.length} 筆紀錄`, 'success');
      
      questions.value = questions.value.filter(q => !targetIds.includes(String(q.id)));
      
      if (!target.id) {
        statsViewMode.value = 'all';
      }
    } else {
      showAlert('提醒', res.message || '刪除失敗', 'error');
      deleteModal.value.show = false;
    }
  } catch (err) {
    console.error("Delete Error:", err);
    showAlert('連線錯誤', '無法與伺服器連線', 'error');
    deleteModal.value.show = false;
  } finally {
    isDeleting.value = false;
    activeTab.value = 'review';
  }
};

const reAnalyzeItem = async (item) => {
  if (item.isAnalyzing) return; 
  
  const { getValidConfig } = useAuth();
  const config = getValidConfig();
  if (!config) return;

  item.isAnalyzing = true;
  try {
    const response = await $fetch('/api/assignments', {
      method: 'POST',
      body: {
        action: 're_analyze',
        sheetId: config.sheet_id,  
        studentId: config.student_id, 
        subject: selectedSubject.value,
        question_text: item.knowledge_point, 
        correct_answer: item.correct_answer
      }
    });

    if (response.success) {
      item.ai_explanation = response.explanation;

      await updateSingleItem(item); 
    } else {
      console.error('AI 重新診斷失敗:', response.error);
    }
  } catch (error) {
    console.error('Request Error:', error);
    showAlert("分析失敗", "無法連線至 AI 伺服器", "error");
  } finally {
    item.isAnalyzing = false;
  }
};

const deleteItem = (id, noID) => {
  deleteModal.value = {
    show: true,
    session: { 
      topic: noID, 
      id: id  
    }
  };
};

const openGoogleAI = (item) => {
  const keyword = item.knowledge_point || "";
  if (!keyword) return;
  
  const query = encodeURIComponent(`${selectedSubject.value} ${keyword} 原理定義`);
  window.open(`https://www.google.com/search?q=${query}`, '_blank');
  
};

const handleAIQuery = (type, item) => {
  const keyword = item.knowledge_point;

  if (!keyword) {
    showToast('請先輸入知識點關鍵字', 'info');
    return;
  }

  const subject = selectedSubject.value || '';

  const prompt = encodeURIComponent(
    `請用老師教學的方式解釋 ${subject} 的概念：${keyword}`
  );

  let baseUrl = '';

  switch (type) {

    case 'perplexity':
      baseUrl = `https://www.perplexity.ai/search?q=${prompt}`;
      break;

    case 'genspark':
      baseUrl = `https://www.genspark.ai/search?q=${prompt}`;
      break;

    case 'chatgpt':
      baseUrl = `https://chat.openai.com/?q=${prompt}`;
      break;

    case 'phind':
      baseUrl = `https://www.phind.com/search?q=${prompt}`;
      break;

    case 'you':
      baseUrl = `https://you.com/search?q=${prompt}`;
      break;

  }

  window.open(baseUrl, '_blank');
};




// 分頁切換載入文字
watch(activeTab, (newTab) => {
  loading.value = true;
  
  if (newTab === 'analytics') {
    uploadStatus.value = '正在整理數據圖表...';
  } else if (newTab === 'review') {
    uploadStatus.value = '正在準備錯題清單...';
  } else if (newTab === 'upload') {
    uploadStatus.value = '正在開啟上傳工具...';
  }
  
  setTimeout(() => {
    loading.value = false;
  }, 400);
});
</script>


<style scoped>
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.4s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translate(-50%, -20px); opacity: 0; }
.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.notification-enter-active,
.notification-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.notification-enter-from {
  opacity: 0;
  transform: translate(-50%, -40px) scale(0.9);
}

.notification-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.95);
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

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


.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.4s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; transform: translate(-50%, -20px); }

</style>
