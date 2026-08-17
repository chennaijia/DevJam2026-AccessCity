import { mockShelters } from '#shared/mock/data'

export default defineEventHandler(() => {
  // TODO: 換成真實避難所資料，並依使用者座標排序與計算可達性
  return mockShelters
})
