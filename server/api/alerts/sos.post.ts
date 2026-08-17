import type { AlertDoc } from '../../utils/repo'
import { alerts } from '../../utils/repo'
import { notifyCaregivers } from '../../utils/push'
import { nowHHMM, requireAppUser, requireFamilyId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const familyId = await requireFamilyId(event)
  const body = await readBody<{ lat?: number; lng?: number }>(event).catch(
    () => ({}) as { lat?: number; lng?: number },
  )

  const alert: AlertDoc = {
    id: `al_${Date.now()}`,
    familyId,
    kind: 'emergency',
    memberId: user.id,
    memberName: user.name,
    title: 'Emergency Alert',
    message: `${user.name} has requested immediate assistance.`,
    sourceLabel: 'Manual SOS',
    location: body?.lat ? `${body.lat}, ${body.lng}` : 'Main St. near 4th Ave',
    time: `${nowHHMM()} · just now`,
    lastMovement: 'just now',
    acknowledged: false,
    createdAt: new Date().toISOString(),
  }

  await alerts.set(alert)

  await notifyCaregivers(familyId, {
    title: '緊急求助',
    body: `${user.name} 按下了 SOS，請盡快聯絡`,
    url: `/caregiver/alerts/${alert.id}`,
    alertId: alert.id,
  })

  return alert
})
