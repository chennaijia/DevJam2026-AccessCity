import { getAppUser } from '../utils/session'

/**
 * API 層的登入保護：/api/** 一律需要 session，只有登入相關的端點放行。
 * 未登入回 401，前端的 session middleware 會把人導回 /login。
 */
const PUBLIC_PREFIXES = ['/api/auth/', '/api/_']

export default defineEventHandler(async (event) => {
  const path = event.path?.split('?')[0] ?? ''
  if (!path.startsWith('/api/')) return
  if (PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))) return

  const user = await getAppUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: '尚未登入' })
})
