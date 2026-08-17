import { tripRecords } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const records = await tripRecords.list({ userId: user.id })

  // 直接由行程紀錄彙總，不再是寫死的數字
  const kmTracked = records.reduce((sum, r) => sum + (parseFloat(r.distanceLabel) || 0), 0)

  return {
    kmTracked: Math.round(kmTracked * 10) / 10,
    safeArrivals: records.filter((r) => r.status === 'arrived').length,
    recentActivity: records.slice(0, 2).map((r) => ({
      id: r.id,
      title: r.status === 'arrived' ? 'Safe Arrival' : 'Trip',
      detail: `${r.destination} • ${r.dateLabel}`,
      kind: r.status === 'arrived' ? 'arrival' : 'walk',
    })),
  }
})
