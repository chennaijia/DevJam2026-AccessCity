import { requireAppUser } from '../utils/session'

export default defineEventHandler(async (event) => {
  // 未登入會回 401，前端 middleware 會導回 /login
  return await requireAppUser(event)
})
