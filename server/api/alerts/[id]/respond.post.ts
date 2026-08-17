import { alerts } from '../../../utils/repo'
import { notifyUser } from '../../../utils/push'
import { requireAppUser, requireFamilyId } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const familyId = await requireFamilyId(event)
  const id = getRouterParam(event, 'id')!
  const { action } = await readBody<{ action: 'responding' | 'received' }>(event)

  const alert = await alerts.get(id)
  if (!alert || alert.familyId !== familyId) {
    throw createError({ statusCode: 404, statusMessage: '找不到這則提醒' })
  }

  await alerts.update(id, { acknowledged: true })

  if (action === 'responding') {
    const caregiver = await requireAppUser(event)
    await notifyUser(alert.memberId, {
      title: `${caregiver.name} 正在前往`,
      body: '你的照顧者已經收到提醒，正在過去找你。',
      url: '/notifications',
      kind: 'info',
    })
  }

  return { ok: true, alertId: id, action }
})
