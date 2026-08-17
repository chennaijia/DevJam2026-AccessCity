import { ensureUserSeed, places } from '../utils/repo'
import { requireAppUser } from '../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  await ensureUserSeed(user.id)
  return await places.list({ userId: user.id })
})
