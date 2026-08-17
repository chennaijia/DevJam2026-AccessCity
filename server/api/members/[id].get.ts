import { members } from '../../utils/repo'
import { canAccessFamily } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const member = await members.get(id)
  if (!member || !(await canAccessFamily(event, member.familyId))) {
    throw createError({ statusCode: 404, statusMessage: 'Member not found' })
  }

  return member
})
