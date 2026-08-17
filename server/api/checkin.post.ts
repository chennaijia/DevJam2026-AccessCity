import { alerts, checkins, trips } from '../utils/repo'
import { notifyCaregivers } from '../utils/push'
import { nowHHMM, requireAppUser, requireFamilyId } from '../utils/session'

/**
 * Care Agent 的 Check-in：Detect → Ask → Wait → Escalate（企劃書 §4.7）
 *   ok           使用者說沒事   → 只留紀錄，不打擾照顧者
 *   need-help    使用者要幫忙   → 立刻升級為 Care Alert
 *   no-response  等待逾時未回覆 → 同樣升級為 Care Alert（來源標成「未回覆」）
 */
export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const familyId = await requireFamilyId(event)
  const { answer } = await readBody<{ answer: 'ok' | 'need-help' | 'no-response' }>(event)

  await checkins.set({
    id: `c_${Date.now()}`,
    userId: user.id,
    answer,
    createdAt: new Date().toISOString(),
  })

  const titleByAnswer = {
    ok: '安全確認：回覆沒事',
    'need-help': '安全確認：需要協助',
    'no-response': '安全確認：未回覆',
  } as const

  // 寫進行程時間軸，照顧者端看得到
  const [trip] = await trips.list({ familyId })
  if (trip) {
    await trips.update(trip.id, {
      events: [
        ...trip.events,
        {
          id: `e_${Date.now()}`,
          time: nowHHMM(),
          title: titleByAnswer[answer] ?? '安全確認',
          detail:
            answer === 'ok'
              ? '使用者回覆沒事'
              : answer === 'need-help'
                ? '使用者要求協助，已通知照顧者'
                : '詢問後未回覆，已升級通知照顧者',
          kind: 'checkin',
        },
      ],
    })
  }

  if (answer !== 'ok') {
    const escalated = answer === 'no-response'
    const alertId = `al_${Date.now()}`
    await alerts.set({
      id: alertId,
      familyId,
      kind: 'safety-check',
      memberId: user.id,
      memberName: user.name,
      title: '安全確認提醒',
      message: escalated
        ? `${user.name} 沒有回覆安全確認。`
        : `${user.name} 在安全確認中要求協助。`,
      sourceLabel: escalated ? '系統自動偵測' : '本人主動回報',
      location: trip?.currentLocation ?? '尚未取得位置',
      time: `${nowHHMM()} · 剛剛`,
      lastMovement: '剛剛',
      acknowledged: false,
      createdAt: new Date().toISOString(),
    })
    // 推播給家庭裡的照顧者
    await notifyCaregivers(familyId, {
      title: '安全確認提醒',
      body: escalated
        ? `${user.name} 沒有回覆安全檢查`
        : `${user.name} 在安全檢查中要求協助`,
      url: `/caregiver/alerts/${alertId}`,
      alertId,
    })
  }

  return { ok: true, escalated: answer !== 'ok' }
})
