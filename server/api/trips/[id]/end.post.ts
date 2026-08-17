import { tripRecords, trips } from '../../../utils/repo'
import { nowHHMM, requireAppUser, requireFamilyId } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const familyId = await requireFamilyId(event)
  const id = getRouterParam(event, 'id')!

  const trip = (await trips.get(id)) ?? (await trips.list({ familyId }))[0]
  if (!trip) throw createError({ statusCode: 404, statusMessage: '找不到行程' })

  await trips.update(trip.id, {
    status: 'arrived',
    events: [
      ...trip.events,
      {
        id: `e_${Date.now()}`,
        time: nowHHMM(),
        title: 'Trip Ended',
        detail: '行程結束',
        kind: 'arrival',
      },
    ],
  })

  // 寫進最近紀錄，首頁「最近紀錄」會看到
  await tripRecords.set({
    id: `tr_${Date.now()}`,
    userId: user.id,
    destination: trip.destination,
    dateLabel: `今天 ${trip.startedAt}`,
    durationLabel: '—',
    distanceLabel: '—',
    status: 'arrived',
    statusLabel: '安全抵達',
  })

  return { ok: true, tripId: trip.id }
})
