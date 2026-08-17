import { db, nowHHMM } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const { destination, routeId } = await readBody<{ destination: string; routeId: string }>(event)

  // TODO: 建立行程紀錄、開始接收位置回報、通知已連結的照顧者「行程開始」
  db.trip = {
    ...db.trip,
    id: `t_${Date.now()}`,
    status: 'on-trip',
    destination: destination || db.trip.destination,
    startedAt: nowHHMM(),
    events: [
      {
        id: `e_${Date.now()}`,
        time: nowHHMM(),
        title: 'Trip Started',
        detail: `前往 ${destination}（route: ${routeId}）`,
        kind: 'start',
      },
    ],
  }

  return db.trip
})
