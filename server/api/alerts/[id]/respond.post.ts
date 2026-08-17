import { db } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { action } = await readBody<{ action: 'responding' | 'received' }>(event)

  const alert = db.alerts.find((a) => a.id === id)
  if (alert) alert.acknowledged = true

  // TODO: action = 'responding' 時，推播給被照顧者「家人正在前往」
  return { ok: true, alertId: id, action }
})
