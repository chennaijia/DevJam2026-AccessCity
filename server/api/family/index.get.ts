import { families, members } from '../../utils/repo'
import { requireFamilyId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const familyId = await requireFamilyId(event)

  const family = await families.get(familyId)
  if (!family) throw createError({ statusCode: 404, statusMessage: '找不到家庭' })

  return { ...family, members: await members.list({ familyId }) }
})
