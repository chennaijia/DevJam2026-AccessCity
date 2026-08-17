import { trips } from '../../utils/repo'
import { nowHHMM, requireAppUser, requireFamilyId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const familyId = await requireFamilyId(event)
  const { destination, routeId } = await readBody<{ destination: string; routeId: string }>(event)

  const trip = {
    id: `t_${Date.now()}`,
    familyId,
    memberId: user.id,
    status: 'on-trip' as const,
    destination: destination || '未指定目的地',
    eta: '',
    currentLocation: 'Main St. near 4th Ave',
    startedAt: nowHHMM(),
    events: [
      {
        id: `e_${Date.now()}`,
        time: nowHHMM(),
        title: 'Trip Started',
        detail: `前往 ${destination}（route: ${routeId}）`,
        kind: 'start' as const,
      },
    ],
  }

  // demo：一個家庭同時只留一筆進行中的行程
  const previous = await trips.list({ familyId })
  await Promise.all(previous.map((t) => trips.remove(t.id)))
  await trips.set(trip)

  // TODO: 通知家庭裡的照顧者「行程開始」
  return trip
})
