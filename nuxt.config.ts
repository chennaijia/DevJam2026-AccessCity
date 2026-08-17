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
      ],
    },
  },
  runtimeConfig: {
    // 只有伺服器端（server/api/**）能讀到，對應 .env 的 GEMINI_API_KEY
    geminiApiKey: '',
    public: {
      // TODO: 之後改由 .env 提供（NUXT_PUBLIC_API_BASE）
      apiBase: '/api',
      // TODO: 之後接 Google Maps JavaScript API 時填入（NUXT_PUBLIC_GOOGLE_MAPS_KEY）
      googleMapsKey: '',
    },
  },
})
