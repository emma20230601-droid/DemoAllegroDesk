<template>
  <div class="max-w-[1400px] mx-auto animate-in fade-in duration-700">
    
    <header class="mb-12 lg:mb-16">
      <p class="text-[10px] lg:text-xs tracking-[0.4em] text-[#888888] uppercase mb-4 font-medium">New Practice Entry</p>
      <h1 class="text-3xl lg:text-4xl font-normal tracking-tight text-[#111111]">新增練習紀錄</h1>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-start">
      
      <div class="md:col-span-7 space-y-12 lg:space-y-16">
        <div class="space-y-10 lg:space-y-12">
          
          <div class="group">
            <label class="text-xs tracking-[0.2em] text-[#666666] uppercase block mb-4 font-bold border-l-2 border-[#333333] pl-4">樂曲名稱</label>
            <input 
              v-model="form.title"
              type="text" 
              placeholder="例如：Elgar Cello Concerto Mov.1..." 
              class="w-full bg-transparent border-b border-[#EEEBE5] py-4 lg:py-5 focus:outline-none focus:border-[#333333] transition-all text-lg lg:text-xl font-normal placeholder:text-[#DDDDDD]"
            >
          </div>
          
          <div>
            <label class="text-xs tracking-[0.2em] text-[#666666] uppercase block mb-6 lg:mb-8 font-bold border-l-2 border-[#333333] pl-4">練習類別</label>
            <div class="flex flex-wrap gap-6 lg:gap-10">
              <button 
                v-for="t in ['Piano', 'Cello', 'Technique']" 
                :key="t"
                @click="form.type = t"
                :class="[
                  'relative pb-2 text-xs lg:text-sm tracking-[0.3em] font-medium uppercase transition-all duration-300',
                  form.type === t ? 'text-[#111111] after:w-full' : 'text-[#AAAAAA] hover:text-[#333333] after:w-0'
                ]"
                class="after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-[#333333] after:transition-all hover:after:w-full bg-transparent"
              >
                {{ t }}
              </button>
            </div>
          </div>

          <div class="group">
            <label class="text-xs tracking-[0.2em] text-[#666666] uppercase block mb-4 font-bold border-l-2 border-[#333333] pl-4">練習重點 / 心得</label>
            <textarea 
              v-model="form.notes"
              rows="5"
              placeholder="記錄今天的指法、音色調整或待解決的難點..." 
              class="w-full bg-[#F9F9F7] border-none rounded-2xl p-6 focus:outline-none focus:ring-1 focus:ring-[#EEEBE5] transition-all text-sm lg:text-base font-normal placeholder:text-[#CCCCCC] resize-none"
            ></textarea>
          </div>
        </div>

        <div class="mt-12 lg:mt-16 pt-8 border-t border-[#F5F5F0]">
          <button 
            @click="handleSave"
            :disabled="isSaving"
            class="group relative flex items-center justify-center gap-6 px-10 lg:px-12 py-4 bg-white border border-[#EEEBE5] hover:border-[#333333] rounded-full transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <span class="text-[10px] lg:text-[11px] font-bold tracking-[0.6em] text-[#666666] group-hover:text-[#111111] uppercase transition-colors">
              {{ isSaving ? 'Syncing...' : 'Confirm & Save' }}
            </span>
            <svg v-if="!isSaving" class="w-4 h-4 text-[#AAAAAA] group-hover:text-[#111111] transition-all duration-500 group-hover:translate-x-1" 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          
          <p class="mt-4 text-[9px] tracking-[0.2em] text-[#CCCCCC] uppercase">
            {{ saveStatus || 'Saved to Assignments sheet.' }}
          </p>
        </div>
      </div>

      <div class="md:col-span-5">
        <div class="bg-[#F9F8F4] p-8 lg:p-12 rounded-[2rem] lg:rounded-[2.5rem] border border-[#F2F1EC] md:sticky md:top-8">
          <h3 class="text-sm lg:text-base font-bold text-[#222222] mb-6 tracking-wide uppercase">練習指南</h3>
          <p class="text-[14px] lg:text-[15px] text-[#555555] leading-loose italic">
            「精確是唯一的捷徑。」<br/><br/>
            詳細記錄練習時的指法問題、節拍器速度或待解決的難點，能幫助你在下一次練習時快速進入狀態。
          </p>
          <div class="mt-10 lg:mt-12 space-y-4">
            <div class="flex items-center gap-4 text-[#AAAAAA]">
              <div class="w-1.5 h-1.5 rounded-full bg-[#333333]"></div>
              <span class="text-[10px] lg:text-[11px] tracking-widest uppercase font-medium">Practice Logs Only</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const isSaving = ref(false)
const saveStatus = ref('')

const form = reactive({
  title: '',
  type: 'Piano',
  notes: '',
  status: 'In Progress'
})

const handleSave = async () => {
  if (!form.title) {
    saveStatus.value = 'Please enter a title.'
    return
  }

  isSaving.value = true
  saveStatus.value = 'Syncing...'

  try {
    const response = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheetName: 'Assignments', // 固定存入練習紀錄分頁
        data: {
          title: form.title,
          type: form.type,
          notes: form.notes,
          status: form.status
        }
      })
    })

    if (response.ok) {
      saveStatus.value = 'SUCCESSFULLY SAVED.'
      // 成功後清空標題與備註
      form.title = ''
      form.notes = ''
    } else {
      throw new Error('Save failed')
    }
  } catch (error) {
    saveStatus.value = 'ERROR: UNABLE TO SYNC.'
  } finally {
    isSaving.value = false
    setTimeout(() => { saveStatus.value = '' }, 3000)
  }
}
</script>