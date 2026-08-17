// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  // nuxt-auth-utils：Google OAuth + 加密 session cookie
  modules: ['nuxt-auth-utils'],
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
        // App 圖示用品牌標誌；吉祥物 Mimo 只出現在畫面裡
        { rel: 'icon', type: 'image/png', href: '/logo-icon.png' },
        { rel: 'apple-touch-icon', href: '/logo.png' },
      ],
    },
  },
  runtimeConfig: {
    // 只有伺服器端（server/api/**）能讀到，對應 .env 的 GEMINI_API_KEY
    geminiApiKey: '',
    googleRoutesApiKey: '',
    // 「最近的 XX」這種相對地點查詢要用 Places Nearby Search 解析，對應 .env 的 GOOGLE_PLACES_API_KEY
    googlePlacesApiKey: '',
    // Firebase Admin 服務帳戶（JSON 或 base64），對應 .env 的 NUXT_FIREBASE_SERVICE_ACCOUNT
    firebaseServiceAccount: '',
    // 瀏覽器無法取得定位時使用的預設起點（地址或地名）。
    googleRoutesOrigin: '',
    public: {
      // TODO: 之後改由 .env 提供（NUXT_PUBLIC_API_BASE）
      apiBase: '/api',
      // TODO: 之後接 Google Maps JavaScript API 時填入（NUXT_PUBLIC_GOOGLE_MAPS_KEY）
      googleMapsKey: '',
      // Firebase Web SDK 設定（可公開，安全性靠 Firebase 規則與後端驗證）
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        appId: '',
        // Web Push（Cloud Messaging）需要這兩個
        messagingSenderId: '',
        vapidKey: '',
      },
    },
  },
})
