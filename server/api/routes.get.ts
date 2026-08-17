import type { RouteOption } from '#shared/types/accessity'
import { db } from '../utils/store'
import { findConflicts } from '../data/construction'

/**
 * Navigation Agent：回傳候選路線（企劃書 §4.4 施工感知導航）
 *
 * 目前的流程：
 *   1. 取候選路線（暫時來自 store，之後換成 Google Routes API 的 alternatives）
 *   2. 每條路線的路段 × 施工資料做交叉比對
 *   3. 撞到施工的降級為 not-recommended，沒撞到的依可達性排序
 *   4. 產生「為什麼推薦這條」的說明，帶入目的地、固定需求與今日需求
 *
 * TODO: 1 換成 Google Routes API（walking + alternatives），
 *       2 的比對換成 polyline 與施工 GeoJSON 的空間交集。
 */
export default defineEventHandler((event) => {
  const {
    destination = '',
    needs = '',
    today = '',
  } = getQuery(event) as { destination?: string; needs?: string; today?: string }

  const needList = String(needs).split(',').filter(Boolean)
  const todayList = String(today).split(',').filter(Boolean)
  // 今日需求沒帶就沿用後端記住的那份
  const activeToday = todayList.length ? todayList : db.todayNeeds
  const avoidConstruction = activeToday.includes('avoid-construction')

  // 1 + 2：候選路線與施工資料比對
  const scored = db.routes.map((route) => {
    const conflicts = findConflicts(route.segments)
    return { route, conflicts }
  })

  // 3：撞到施工的往下排，其餘依無障礙分數排序
  const ranked = [...scored].sort((a, b) => {
    if (a.conflicts.length !== b.conflicts.length) return a.conflicts.length - b.conflicts.length
    return (b.route.accessibilityScore ?? 0) - (a.route.accessibilityScore ?? 0)
  })

  const bestId = ranked[0]?.route.id

  const result: RouteOption[] = ranked.map(({ route, conflicts }) => {
    const blocked = conflicts.length > 0
    const isBest = route.id === bestId && !blocked

    // 4：說明文字
    const parts: string[] = []
    if (isBest) {
      const avoided = scored
        .flatMap((s) => s.conflicts)
        .map((c) => c.road)
        .filter((road, i, all) => all.indexOf(road) === i)
      if (avoided.length) parts.push(`避開了${avoided.join('、')}的施工`)
      if (route.tags.includes('Elevator')) parts.push('沿路電梯可用')
      if (needList.includes('wheelchair')) parts.push('全程無台階')
      if (activeToday.includes('tired') || activeToday.includes('short')) parts.push('步行距離較短')
      if (activeToday.includes('rest')) parts.push('中途有休息點')
      if (activeToday.includes('shade')) parts.push('大部分路段有遮蔭')
    }

    return {
      ...route,
      badge: blocked ? 'not-recommended' : isBest ? 'recommended' : 'alternative',
      badgeLabel: blocked ? 'NOT RECOMMENDED' : isBest ? 'RECOMMENDED' : 'ALTERNATIVE',
      warning: blocked
        ? `${conflicts.map((c) => c.road).join('、')} 施工中${
            conflicts.some((c) => c.severity === 'blocked') ? '（人行道封閉）' : ''
          }`
        : route.warning,
      constructionConflicts: conflicts,
      reason: isBest
        ? `為什麼推薦這條？${parts.join('，')}${destination ? `，直接到${destination}` : ''}。${
            avoidConstruction ? '（你今天想避開施工）' : ''
          }`
        : undefined,
    }
  })

  return result
})
