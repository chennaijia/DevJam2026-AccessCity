import type { SavedPlace } from '#shared/types/accessity'
import { places } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

/** 新增一筆常用地址，存在使用者帳號底下（Firestore：places/{userId}_{timestamp}） */
export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const body = await readBody<Partial<SavedPlace>>(event)

  const label = body.label?.trim()
  const address = body.address?.trim()
  if (!label || !address) throw createError({ statusCode: 400, statusMessage: '請填寫名稱與地址' })

  const place = {
    id: `${user.id}_${Date.now()}`,
    userId: user.id,
    label,
    address,
    icon: body.icon ?? 'pin',
  }
  await places.set(place)
  return place
})
