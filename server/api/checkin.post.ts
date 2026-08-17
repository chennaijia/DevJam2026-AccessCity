import { db, nowHHMM } from '../utils/store'

/**
 * Care Agent 的 Check-in 回覆：Detect → Ask → Wait → Escalate
 * TODO: 'need-help' 或逾時未回覆時，建立 Care Alert 並推播給照顧者。
 */
export default defineEventHandler(async (event) => {
  const { answer } = await readBody<{ answer: 'ok' | 'need-help' }>(event)

  db.checkins.push({ id: `c_${Date.now()}`, answer, createdAt: new Date().toISOString() })

  db.trip.events.push({
    id: `e_${Date.now()}`,
    time: nowHHMM(),
    title: answer === 'ok' ? 'Check-in: I am OK' : 'Check-in: Needs help',
    detail: answer === 'ok' ? '使用者回覆沒事' : '已通知照顧者',
    kind: 'checkin',
  })

  if (answer === 'need-help') {
    db.alerts.unshift({
      id: `al_${Date.now()}`,
      kind: 'safety-check',
      memberId: 'm_kai',
      memberName: 'Kai',
      title: 'Safety Alert',
      message: 'Kai asked for help during a safety check.',
      sourceLabel: 'Self Check-in',
      location: 'Main St. near 4th Ave',
      time: `${nowHHMM()} · just now`,
      lastMovement: 'just now',
      acknowledged: false,
    })
  }

  return { ok: true }
})
