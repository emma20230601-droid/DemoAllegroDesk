// nuxt.config.ts

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  future: { compatibilityVersion: 4 },

  runtimeConfig: {
    // 🚩 這裡會直接讀取 Vercel 後台設定的環境變數
    googleCredentials: process.env.GOOGLE_CREDENTIALS,
    registrySheetId: process.env.REGISTRY_SHEET_ID,
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    cloudinaryName: process.env.CLOUDINARY_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  },app: {
    head: {
      title: 'AllegroDesk',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0' },
        // 關鍵：開啟 iOS 全螢幕模式 (點擊主畫面圖示開啟後，不會看到網址列)
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        // 狀態列顏色 (可選: default, black, black-translucent)
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'AllegroDesk' },
      ],
      link: [
        // 這是 iPad 桌面上看到的圖示 (請確保 public/icon.png 存在)
        { rel: 'apple-touch-icon', href: '/icon.png' },
        // 這是瀏覽器分頁的小圖示
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  modules: ['@nuxtjs/tailwindcss'],
  devtools: { enabled: true },
  nitro: {
    routeRules: {
      '/api/**': { 
        bodySizeLimit: '10MB' // 將限制放寬到 10MB
      }
    }
  }
})
