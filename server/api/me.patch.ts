import type { AccessNeed, Role } from '#shared/types/accessity'
import { users } from '../utils/repo'
import { invalidateUserCache, requireAppUser } from '../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const body = await readBody<{ role?: Role; needs?: AccessNeed[]; name?: string }>(event)

  const patch: Record<string, unknown> = {}
  if (body.role) patch.role = body.role
  if (body.needs) patch.needs = body.needs
  if (body.name) patch.name = body.name
  // Email 由 Google 帳號決定，不開放改

  if (!Object.keys(patch).length) return user
  invalidateUserCache(user.id)
  return await users.update(user.id, patch)
})
