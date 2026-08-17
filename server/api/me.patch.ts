import type { AccessNeed, Role } from '#shared/types/accessity'
import { currentUser } from '../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ role?: Role; needs?: AccessNeed[]; name?: string; email?: string }>(
    event,
  )
  const user = currentUser()

  if (body.role) user.role = body.role
  if (body.needs) user.needs = body.needs
  if (body.name) user.name = body.name
  if (body.email) user.email = body.email

  return user
})
