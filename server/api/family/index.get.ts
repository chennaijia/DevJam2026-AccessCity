import { db } from '../../utils/store'

export default defineEventHandler(() => {
  return { ...db.family, members: db.members }
})
