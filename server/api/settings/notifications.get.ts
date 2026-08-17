import { db } from '../../utils/store'

export default defineEventHandler(() => {
  return db.settings
})
