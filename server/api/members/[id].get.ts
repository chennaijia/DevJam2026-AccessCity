import { db } from '../../utils/store'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const member = db.members.find((m) => m.id === id)

  if (!member) throw createError({ statusCode: 404, statusMessage: 'Member not found' })
  return member
})
