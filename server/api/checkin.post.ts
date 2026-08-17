import { db, nowHHMM } from '../utils/store'

/**
 * Care Agent 的 Check-in：Detect → Ask → Wait → Escalate（企劃書 §4.7）
 *   ok           使用者說沒事   → 只留紀錄，不打擾照顧者
 *   need-help    使用者要幫忙   → 立刻升級為 Care Alert
 *   no-response  等待逾時未回覆 → 同樣升級為 Care Alert（來源標成「未回覆」）
 */
export default defineEventHandler(async (event) => {
  const { answer } = await readBody<{ answer: 'ok' | 'need-help' | 'no-response' }>(event)

  db.checkins.push({ id: `c_${Date.now()}`, answer, createdAt: new Date().toISOString() })

  const titleByAnswer = {
    ok: 'Check-in: I am OK',
    'need-help': 'Check-in: Needs help',
    'no-response': 'Check-in: No response',
  } as const

  db.trip.events.push({
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
  })

  if (answer !== 'ok') {
    const escalated = answer === 'no-response'
    db.alerts.unshift({
      id: `al_${Date.now()}`,
      kind: 'safety-check',
      memberId: 'm_kai',
      memberName: 'Kai',
      title: 'Safety Alert',
      message: escalated
        ? 'Kai has not responded to the safety check.'
        : 'Kai asked for help during a safety check.',
      sourceLabel: escalated ? 'Automatic Safety Alert' : 'Self Check-in',
      location: db.trip.currentLocation,
      time: `${nowHHMM()} · just now`,
      lastMovement: 'just now',
      acknowledged: false,
    })

    // TODO: 推播給所有已連結的照顧者（FCM / APNs）
  }

  return { ok: true, escalated: answer !== 'ok' }
})
