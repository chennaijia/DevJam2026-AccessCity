import { ensureFamilySeed, ensureUserSeed, users } from '../../utils/repo'
import { setAppSession } from '../../utils/session'

/**
 * Demo 登入：沒有設定 Firebase 金鑰時（或現場網路不通）也能把流程走完。
 * 正式環境請關掉這支，只留 Google 登入。
 */
export default defineEventHandler(async (event) => {
  const { role } = await readBody<{ role?: 'caregiver' | 'care-recipient' }>(event).catch(() => ({
    role: undefined,
  }))

  await ensureFamilySeed()

  // 固定用種子帳號，不要抓到真實 Google 登入過的使用者
  const demoId = role === 'caregiver' ? 'u_naijia' : 'u_kai'
  const user =
    (await users.get(demoId)) ??
    (await users.list()).find((u) =>
      role === 'caregiver' ? u.role === 'caregiver' : u.role === 'care-recipient',
    )

  if (!user) throw createError({ statusCode: 500, statusMessage: 'Demo 帳號尚未建立' })

  const updated = await users.update(user.id, { provider: 'demo' })
  await ensureUserSeed(updated.id)
  await setAppSession(event, updated)
  return updated
})
