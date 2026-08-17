/**
 * Firebase Cloud Messaging 的 service worker。
 *
 * 必須放在網站根目錄、而且不能經過打包工具，所以直接放 public/ 並用 compat 版 SDK。
 * service worker 讀不到 runtimeConfig，設定值由註冊時的 query string 帶進來
 * （見 app/composables/usePush.ts）。
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

const config = Object.fromEntries(new URL(location).searchParams.entries())

if (config.apiKey) {
  firebase.initializeApp(config)

  // App 在背景（分頁關閉／切走）時收到的訊息
  firebase.messaging().onBackgroundMessage((payload) => {
    const { title, body } = payload.notification ?? {}
    const url = payload.data?.url ?? '/caregiver/alerts'

    self.registration.showNotification(title ?? 'Accessity', {
      body: body ?? '',
      icon: '/mimo-icon.png',
      badge: '/mimo-icon.png',
      tag: payload.data?.alertId ?? 'accessity-alert',
      // 安全提醒不要自己消失，要讓照顧者一定看到
      requireInteraction: payload.data?.kind !== 'info',
      data: { url },
    })
  })
}

// 點通知就直接開到那則提醒；已經開著的分頁就聚焦過去
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url ?? '/caregiver/alerts'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      return clients.openWindow(target)
    }),
  )
})
