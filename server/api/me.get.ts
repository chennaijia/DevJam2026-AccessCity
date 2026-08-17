import { currentUser } from '../utils/store'

export default defineEventHandler(() => {
  // TODO: 從 token / session 取得使用者，未登入回 401
  return currentUser()
})
