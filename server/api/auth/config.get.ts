import { hasFirebase } from '../../utils/firebase'

export default defineEventHandler(() => {
  const { public: publicConfig } = useRuntimeConfig()

  // 只回傳「有沒有設定」，不會把金鑰吐給前端
  return {
    // 前端要能初始化 Firebase SDK，後端要能驗證 idToken，兩邊都齊了才算啟用
    googleEnabled: !!publicConfig.firebase?.apiKey && hasFirebase(),
    firestoreEnabled: hasFirebase(),
  }
})
