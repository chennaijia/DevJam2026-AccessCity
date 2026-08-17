import { createFamilyFor, families, members } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)

  // 照顧者第一次進來時，直接幫他建立自己的家庭與代碼
  if (!user.familyId) {
    if (user.role !== 'caregiver') {
      throw createError({ statusCode: 404, statusMessage: '你還沒有加入家庭，請用照顧者給的代碼加入' })
    }
    const created = await createFamilyFor(user)
    return { ...created, members: [] }
  }

  const family = await families.get(user.familyId)
  if (!family) throw createError({ statusCode: 404, statusMessage: '找不到家庭' })

  return { ...family, members: await members.list({ familyId: family.id }) }
})
