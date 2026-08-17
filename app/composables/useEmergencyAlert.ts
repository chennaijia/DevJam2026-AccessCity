/**
 * 緊急求助的即時提醒（照顧者端）
 *
 * 緊急事件不能只躺在通知清單裡，所以：
 *   1. App 開著時定期確認有沒有新的緊急求助
 *   2. 前景推播進來時立刻反應
 *   3. 跳出全螢幕彈窗 + 震動 + 提示音，直到照顧者回應
 */
import type { CareAlert } from '#shared/types/accessity'

/** 震動節奏：短-短-長，重複到使用者回應為止 */
const VIBRATE_PATTERN = [300, 120, 300, 120, 600]
const REPEAT_MS = 2500
/** App 開著時的輪詢間隔（TODO: 之後改用 SSE 就可以拿掉） */
const POLL_MS = 20000

export function useEmergencyAlert() {
  const { isCaregiver } = useSession()
  const { alerts, load, respond } = useAlerts()
  const { foreground } = usePush()

  const current = useState<CareAlert | null>('accessity:emergency', () => null)
  /** 使用者選「稍後處理」的事件，同一次開啟不再跳 */
  const snoozed = useState<string[]>('accessity:emergency-snoozed', () => [])

  let repeatTimer: ReturnType<typeof setInterval> | undefined
  let pollTimer: ReturnType<typeof setInterval> | undefined

  /* ------------------------------------------------------- 震動與提示音 */

  function buzz() {
    if (!import.meta.client) return

    // 震動只有行動裝置支援，桌機會直接回 false
    navigator.vibrate?.(VIBRATE_PATTERN)

    try {
      // 短促的兩聲提示音；瀏覽器要求使用者先與頁面互動過才會出聲
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const now = ctx.currentTime
      for (const offset of [0, 0.35]) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.0001, now + offset)
        gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.25)
        osc.connect(gain).connect(ctx.destination)
        osc.start(now + offset)
        osc.stop(now + offset + 0.3)
      }
      setTimeout(() => ctx.close(), 1200)
    } catch {
      // 沒有音訊權限就算了，震動與畫面已經夠明顯
    }
  }

  function startBuzzing() {
    buzz()
    clearInterval(repeatTimer)
    repeatTimer = setInterval(buzz, REPEAT_MS)
  }

  function stopBuzzing() {
    clearInterval(repeatTimer)
    repeatTimer = undefined
    if (import.meta.client) navigator.vibrate?.(0)
  }

  /* ----------------------------------------------------------- 事件偵測 */

  function pickEmergency() {
    return (
      alerts.value.find(
        (a) => a.kind === 'emergency' && !a.acknowledged && !snoozed.value.includes(a.id),
      ) ?? null
    )
  }

  async function check() {
    if (!isCaregiver.value) return
    await load(true)

    const next = pickEmergency()
    if (next && next.id !== current.value?.id) {
      current.value = next
      startBuzzing()
    }
  }

  function start() {
    if (!import.meta.client || !isCaregiver.value) return
    check()
    clearInterval(pollTimer)
    pollTimer = setInterval(check, POLL_MS)
  }

  function stop() {
    clearInterval(pollTimer)
    pollTimer = undefined
    stopBuzzing()
  }

  // 前景推播是緊急事件 → 立刻抓最新狀態，不等輪詢
  watch(foreground, (message) => {
    if (message?.kind === 'emergency') {
      foreground.value = null
      check()
    }
  })

  /* --------------------------------------------------------- 使用者回應 */

  async function acknowledge(action: 'responding' | 'received') {
    const alert = current.value
    if (!alert) return
    stopBuzzing()
    current.value = null
    await respond(alert.id, action)
  }

  /** 稍後處理：關掉彈窗但保留未處理狀態，提醒中心還看得到 */
  function snooze() {
    if (current.value) snoozed.value = [...snoozed.value, current.value.id]
    stopBuzzing()
    current.value = null
  }

  return { current, start, stop, check, acknowledge, snooze }
}
