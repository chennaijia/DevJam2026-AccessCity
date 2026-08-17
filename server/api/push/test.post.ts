import { notifyUser } from '../../utils/push'
import { requireAppUser } from '../../utils/session'

/** 讓使用者按一下就能確認通知有沒有真的送到（設定頁的「發送測試通知」） */
export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)

  const sent = await notifyUser(user.id, {
    title: 'Accessity 測試通知',
    body: '通知設定成功，有狀況時我們會像這樣提醒你。',
    url: '/notifications',
    kind: 'info',
  })

  return { ok: sent > 0, sent }
})
