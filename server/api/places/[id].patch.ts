import type { SavedPlace } from '#shared/types/accessity'
import { places } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<Partial<SavedPlace>>(event)

  const existing = await places.get(id)
  if (!existing || existing.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Place not found' })
  }

  const patch: Partial<SavedPlace> = {}
  if (body.label?.trim()) patch.label = body.label.trim()
  if (body.address?.trim()) patch.address = body.address.trim()
  if (body.icon) patch.icon = body.icon
  return await places.update(id, patch)
})
