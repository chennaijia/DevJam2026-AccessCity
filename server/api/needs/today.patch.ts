import { db } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const { keys } = await readBody<{ keys: string[] }>(event)

  // TODO: 寫入資料庫並設定 expiresAt（隔天自動失效），路線規劃時一併帶入
  db.todayNeeds = keys ?? []

  return { ok: true, keys: db.todayNeeds }
})
