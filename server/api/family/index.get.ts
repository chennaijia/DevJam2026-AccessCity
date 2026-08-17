import { createFamilyFor, families, familyIdsOf, members, users } from '../../utils/repo'
import { invalidateUserCache, requireAppUser } from '../../utils/session'

/**
 * 被照顧者：回傳自己的照護圈（含代碼與已連結的照顧者），沒有就即時建立
 * 照顧者：回傳已連結的照護圈清單
 */
export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)

  if (user.role === 'care-recipient') {
    // familyId 可能是使用者之前以照顧者身分連結的家庭，不能直接當成自己的代碼。
    // 代碼只屬於 ownerId 對應的被照顧者；角色切換或舊資料也在這裡自動校正。
    const assigned = user.familyId ? await families.get(user.familyId) : null
    const owned =
      assigned?.ownerId === user.id
        ? assigned
        : ((await families.list({ ownerId: user.id })).at(0) ?? null)
    const own = owned ?? (await createFamilyFor(user))

    // 代碼以照護圈為準：使用者身上那份是快取，重新產生後可能過期
    if (user.familyId !== own.id || user.familyCode !== own.code) {
      invalidateUserCache(user.id)
      await users.update(user.id, { familyId: own.id, familyCode: own.code })
    }

    const caregivers = (await users.list({ familyId: own.id }))
      .concat(
        (await users.list()).filter(
          (u) => u.role === 'caregiver' && (u.familyIds ?? []).includes(own.id),
        ),
      )
      .filter((u) => u.role === 'caregiver')

    return {
      ...own,
      members: await members.list({ familyId: own.id }),
      caregivers: caregivers
        .filter((c, i, all) => all.findIndex((x) => x.id === c.id) === i)
        .map((c) => ({ id: c.id, name: c.name, avatar: c.avatar })),
    }
  }

  // 照顧者：把已連結的照護圈與成員一起帶回去
  const ids = familyIdsOf(user)
  const list = (await Promise.all(ids.map((id) => families.get(id)))).filter(Boolean) as Awaited<
    ReturnType<typeof families.get>
  >[]

  const all = await Promise.all(
    list.map(async (f) => ({ ...f!, members: await members.list({ familyId: f!.id }) })),
  )

  return {
    // 為了相容舊畫面，主要那一個直接攤平在最外層
    ...(all[0] ?? { id: '', name: '', code: '', codeExpiresInDays: 0 }),
    members: all.flatMap((f) => f.members),
    families: all,
    caregivers: [],
  }
})
