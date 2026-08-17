import { families, members } from '../../utils/repo'
import { requireFamilyId } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const familyId = await requireFamilyId(event)

  // TODO: 只允許家庭的建立者重新產生；舊碼要立即失效並留操作紀錄
  const family = await families.update(familyId, {
    code: `AC-${Math.floor(10000 + Math.random() * 89999)}`,
    codeExpiresInDays: 7,
  })

  return { ...family, members: await members.list({ familyId }) }
})
