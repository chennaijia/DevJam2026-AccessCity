import { places } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const id = getRouterParam(event, 'id')!

  const existing = await places.get(id)
  if (!existing || existing.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Place not found' })
  }

  await places.remove(id)
  return { ok: true, id }
})
