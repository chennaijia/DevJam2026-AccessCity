import { members } from '../../utils/repo'
import { requireFamilyId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const familyId = await requireFamilyId(event)
  const id = getRouterParam(event, 'id')!

  const member = await members.get(id)
  if (!member || member.familyId !== familyId) {
    throw createError({ statusCode: 404, statusMessage: 'Member not found' })
  }

  return member
})
