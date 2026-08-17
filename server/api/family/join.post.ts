import { families, members, users } from '../../utils/repo'
import { requireAppUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const { code } = await readBody<{ code: string }>(event)

  const target = (await families.list()).find(
    (f) => f.code.toUpperCase() === (code ?? '').trim().toUpperCase(),
  )

  if (!target) return { ok: false, family: null }

  await users.update(user.id, { familyId: target.id, familyCode: target.code })

  return { ok: true, family: { ...target, members: await members.list({ familyId: target.id }) } }
})
