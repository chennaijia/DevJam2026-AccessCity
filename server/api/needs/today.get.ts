import { mockTodayNeedOptions } from '#shared/mock/data'

export default defineEventHandler(() => {
  // 選項本身是固定清單；使用者選了哪些存在 user.todayNeeds
  return mockTodayNeedOptions
})
