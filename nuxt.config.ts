// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Accessity — AccessCity',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'AI-powered Accessible Navigation & Care Companion' },
        { name: 'theme-color', content: '#0b5f5c' },
      ],
      link: [
        // Mimo 當作 App 圖示
        { rel: 'icon', type: 'image/png', href: '/mimo-icon.png' },
        { rel: 'apple-touch-icon', href: '/mimo.png' },
      ],
    },
  },
  runtimeConfig: {
    // 只有伺服器端（server/api/**）能讀到，對應 .env 的 GEMINI_API_KEY
    geminiApiKey: '',
    googleRoutesApiKey: '',
    // 瀏覽器無法取得定位時使用的預設起點（地址或地名）。
    googleRoutesOrigin: '',
    public: {
      // TODO: 之後改由 .env 提供（NUXT_PUBLIC_API_BASE）
      apiBase: '/api',
      // TODO: 之後接 Google Maps JavaScript API 時填入（NUXT_PUBLIC_GOOGLE_MAPS_KEY）
      googleMapsKey: '',
    },
  },
})
