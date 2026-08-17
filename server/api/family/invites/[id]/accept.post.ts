import { members } from '../../../../utils/repo'
import { requireFamilyId } from '../../../../utils/session'

export default defineEventHandler(async (event) => {
  const familyId = await requireFamilyId(event)
  const id = getRouterParam(event, 'id')

  // TODO: 換成真正的邀請實體（含過期時間），目前把家庭裡待確認的成員標成已加入
  const pending = (await members.list({ familyId })).find((m) => m.invitePending)
  if (pending) await members.update(pending.id, { invitePending: false })

  return { ok: true, inviteId: id }
})
