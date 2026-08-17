import { alerts } from '../../../utils/repo'
import { requireFamilyId } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const familyId = await requireFamilyId(event)
  const id = getRouterParam(event, 'id')!
  const { action } = await readBody<{ action: 'responding' | 'received' }>(event)

  const alert = await alerts.get(id)
  if (!alert || alert.familyId !== familyId) {
    throw createError({ statusCode: 404, statusMessage: '找不到這則提醒' })
  }

  await alerts.update(id, { acknowledged: true })

  // TODO: action = 'responding' 時推播給被照顧者「家人正在前往」
  return { ok: true, alertId: id, action }
})
