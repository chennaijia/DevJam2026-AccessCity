import type { Member } from '#shared/types/accessity'
import { members } from '../../utils/repo'
import { requireFamilyId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const familyId = await requireFamilyId(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<Partial<Member>>(event)

  const member = await members.get(id)
  if (!member || member.familyId !== familyId) {
    throw createError({ statusCode: 404, statusMessage: 'Member not found' })
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.stayAlertMinutes === 'number') patch.stayAlertMinutes = body.stayAlertMinutes
  if (body.notifications) patch.notifications = { ...member.notifications, ...body.notifications }

  return await members.update(id, patch)
})
