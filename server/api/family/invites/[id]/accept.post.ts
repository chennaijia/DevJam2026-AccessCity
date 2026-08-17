import { db } from '../../../../utils/store'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')

  // TODO: 依 invite id 查出邀請、確認未過期、建立家庭關聯
  const pending = db.members.find((m) => m.invitePending)
  if (pending) pending.invitePending = false

  return { ok: true, inviteId: id }
})
