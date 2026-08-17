import { mockSavedPlaces } from '#shared/mock/data'

export default defineEventHandler(() => {
  // TODO: 改讀使用者自己儲存的常用地點（含座標），並依使用頻率排序
  return mockSavedPlaces
})
