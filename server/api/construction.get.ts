import { constructionZones } from '../data/construction'

export default defineEventHandler(() => {
  // TODO: 換成即時的城市施工開放資料，並支援用座標範圍查詢
  return constructionZones
})
