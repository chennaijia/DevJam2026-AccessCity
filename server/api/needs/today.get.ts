import { mockTodayNeedOptions } from '#shared/mock/data'

export default defineEventHandler(() => {
  // TODO: 可依使用者過去的「今日需求」使用紀錄推薦排序
  return mockTodayNeedOptions
})
