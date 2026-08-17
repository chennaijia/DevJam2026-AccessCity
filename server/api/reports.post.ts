import { reports } from '../utils/repo'
import { requireAppUser } from '../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const body = await readBody<{ type: string; note: string }>(event)

  // TODO: 加上座標與照片上傳（Firebase Storage），並回饋到路線評分
  await reports.set({
    id: `r_${Date.now()}`,
    userId: user.id,
    type: body.type,
    note: body.note ?? '',
    createdAt: new Date().toISOString(),
  })

  return { ok: true }
})
