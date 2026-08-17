/**
 * 邀請連結目前還沒有實作（沒有邀請實體、沒有寄送、沒有過期）。
 * 加入家庭請走 POST /api/family/join 的代碼流程。
 * TODO: 建立 invites collection（含 email、建立者、過期時間），並在這裡驗證後加入家庭。
 */
export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: '邀請功能尚未開放，請改用家庭代碼加入',
  })
})
