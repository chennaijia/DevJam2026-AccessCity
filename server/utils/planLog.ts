import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * 路線規劃過程的即時訊息。
 *
 * 各個資料來源（施工、無障礙…）本來就會把進度印在伺服器 log，
 * 這裡多存一份到「這次請求」的緩衝區，讓前端也能把同樣的內容顯示給使用者看，
 * 而不是只有開發者看得到。
 *
 * 用 AsyncLocalStorage 是因為同時可能有多個規劃請求在跑，訊息不能互相混到。
 */
const storage = new AsyncLocalStorage<{ lines: string[] }>()

export function runWithPlanLog<T>(fn: () => Promise<T>): Promise<T> {
  return storage.run({ lines: [] }, fn)
}

/** 印到伺服器 log，同時收進這次規劃的訊息列 */
export function planLog(scope: string, message: string) {
  console.log(`[${scope}] ${message}`)
  storage.getStore()?.lines.push(message)
}

/** 只收進畫面用的訊息列（呼叫端已經自己處理過終端機輸出） */
export function collectPlanLine(message: string) {
  storage.getStore()?.lines.push(message)
}

/** 取出目前累積的訊息並清空（每個步驟結束時呼叫一次） */
export function takePlanLines(): string[] {
  const store = storage.getStore()
  if (!store) return []
  return store.lines.splice(0)
}
