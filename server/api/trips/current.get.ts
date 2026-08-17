import { trips } from '../../utils/repo'
import { requireFamilyId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const familyId = await requireFamilyId(event)
  const [trip] = await trips.list({ familyId })

  if (!trip) throw createError({ statusCode: 404, statusMessage: '目前沒有進行中的行程' })
  return trip
})
