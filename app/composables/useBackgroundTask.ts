/**
 * 讓不需要阻塞畫面的寫入在背景完成。
 * 呼叫端應先更新畫面，並在 onError 裡回滾 optimistic state。
 */
export function runInBackground(
  task: Promise<unknown>,
  options: { label: string; onError?: (error: unknown) => void } = { label: 'background task' },
) {
  void task.catch((error) => {
    console.error(`[${options.label}] 背景同步失敗：`, error)
    options.onError?.(error)
  })
}
