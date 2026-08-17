import { db } from '../utils/store'

/**
 * Navigation Agent：回傳候選路線。
 * TODO: 正式版流程 ——
 *   1. 呼叫 Google Routes API（walking + alternatives）取得候選路線
 *   2. 取城市施工 / 淹水開放資料，與每條路線做交集比對
 *   3. 依使用者 needs（輪椅、視障、行動協助）計算 accessibility / safety 分數
 *   4. 排序後回傳，並附上「為什麼推薦這條」的說明文字
 */
export default defineEventHandler((event) => {
  const { destination = '', needs = '' } = getQuery(event) as {
    destination?: string
    needs?: string
  }

  const needList = String(needs).split(',').filter(Boolean)

  return db.routes.map((route) => ({
    ...route,
    // demo：把查詢條件回填到說明中，方便前端驗證有吃到參數
    reason:
      route.badge === 'recommended' && destination
        ? `${route.reason ?? ''}（目的地：${destination}${needList.length ? `，需求：${needList.join('、')}` : ''}）`
        : route.reason,
  }))
})
