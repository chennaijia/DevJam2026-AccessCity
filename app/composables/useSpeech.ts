/**
 * Voice-first（企劃書 §4.5）
 *   speak()  ── Text-to-Speech，用來播報導航指示、Check-in 詢問
 *   listen() ── 語音輸入（Web Speech API），用來說出目的地與需求
 *
 * 兩者都在瀏覽器端執行，不需要額外金鑰；不支援的瀏覽器會回傳 supported = false，
 * 呼叫端要自己降級成文字輸入。
 * TODO: iOS Safari 對 SpeechRecognition 支援不完整，正式版可改接後端 STT（Whisper / Google STT）。
 */
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
}

function getRecognition(): SpeechRecognitionLike | null {
  if (!import.meta.client) return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

export function useSpeech(lang = 'zh-TW') {
  const listening = useState('accessity:listening', () => false)
  const lastSpoken = useState<string>('accessity:last-spoken', () => '')

  const canSpeak = () => import.meta.client && 'speechSynthesis' in window
  const canListen = () => !!getRecognition()

  /** 播報一段文字；同一時間只留最後一句，避免指示疊在一起 */
  function speak(text: string, opts: { rate?: number; force?: boolean } = {}) {
    if (!canSpeak() || !text) return
    if (!opts.force && text === lastSpoken.value) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = opts.rate ?? 0.95
    window.speechSynthesis.speak(utterance)
    lastSpoken.value = text
  }

  /** 重新播報上一句（企劃書要的 Replay） */
  function replay() {
    if (lastSpoken.value) speak(lastSpoken.value, { force: true })
  }

  function stopSpeaking() {
    if (canSpeak()) window.speechSynthesis.cancel()
  }

  /** 聽一句話，回傳辨識到的文字；不支援或失敗時回傳空字串 */
  function listen(): Promise<string> {
    const recognition = getRecognition()
    if (!recognition) return Promise.resolve('')

    return new Promise((resolve) => {
      recognition.lang = lang
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      listening.value = true

      recognition.onresult = (event) => resolve(event.results[0][0].transcript ?? '')
      recognition.onerror = () => resolve('')
      recognition.onend = () => {
        listening.value = false
      }

      recognition.start()
    })
  }

  return { speak, replay, stopSpeaking, listen, listening, canSpeak, canListen }
}
