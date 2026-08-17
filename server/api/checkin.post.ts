import { alerts, checkins, trips } from '../utils/repo'
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
    ok: 'Check-in: I am OK',
    'need-help': 'Check-in: Needs help',
    'no-response': 'Check-in: No response',
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
          title: titleByAnswer[answer] ?? 'Check-in',
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
    await alerts.set({
      id: `al_${Date.now()}`,
      familyId,
      kind: 'safety-check',
      memberId: user.id,
      memberName: user.name,
      title: 'Safety Alert',
      message: escalated
        ? `${user.name} has not responded to the safety check.`
        : `${user.name} asked for help during a safety check.`,
      sourceLabel: escalated ? 'Automatic Safety Alert' : 'Self Check-in',
      location: trip?.currentLocation ?? 'Main St. near 4th Ave',
      time: `${nowHHMM()} · just now`,
      lastMovement: 'just now',
      acknowledged: false,
      createdAt: new Date().toISOString(),
    })
    // TODO: 推播給照顧者（FCM）
  }

  return { ok: true, escalated: answer !== 'ok' }
})
