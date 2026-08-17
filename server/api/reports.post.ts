import { db } from '../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ type: string; note: string }>(event)

  // TODO: 存進資料庫並記錄座標；同類回報累積到門檻後，讓路線評分自動扣分
  db.reports.push({
    id: `r_${Date.now()}`,
    type: body.type,
    note: body.note ?? '',
    createdAt: new Date().toISOString(),
  })

  return { ok: true }
})
