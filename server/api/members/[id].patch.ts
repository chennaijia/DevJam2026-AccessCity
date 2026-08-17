import type { Member } from '#shared/types/accessity'
import { db } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<Partial<Member>>(event)
  const member = db.members.find((m) => m.id === id)

  if (!member) throw createError({ statusCode: 404, statusMessage: 'Member not found' })

  // TODO: 確認呼叫者是這位成員的照顧者才可修改
  if (typeof body.stayAlertMinutes === 'number') member.stayAlertMinutes = body.stayAlertMinutes
  if (body.notifications) member.notifications = { ...member.notifications, ...body.notifications }

  return member
})
