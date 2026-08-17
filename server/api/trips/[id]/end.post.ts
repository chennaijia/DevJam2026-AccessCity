import { db, nowHHMM } from '../../../utils/store'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')

  // TODO: 結束行程、寫入行程統計、通知照顧者「已安全抵達」
  db.trip.status = 'arrived'
  db.trip.events.push({
    id: `e_${Date.now()}`,
    time: nowHHMM(),
    title: 'Trip Ended',
    detail: '行程結束',
    kind: 'arrival',
  })

  return { ok: true, tripId: id }
})
