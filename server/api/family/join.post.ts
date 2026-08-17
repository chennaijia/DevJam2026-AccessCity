import { db, currentUser } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const { code } = await readBody<{ code: string }>(event)

  const ok = (code ?? '').trim().toUpperCase() === db.family.code
  if (ok) {
    // TODO: 寫入 family_members 關聯表，並通知照顧者「有人加入」
    const user = currentUser()
    user.familyCode = db.family.code
    user.connectedCaregiver = { id: 'u_naijia', name: '陳乃嘉' }
  }

  return { ok, family: { ...db.family, members: db.members } }
})
