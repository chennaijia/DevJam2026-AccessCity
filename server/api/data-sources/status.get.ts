import { getRouteDataSourceStatus } from '../../utils/routeScoring'

export default defineEventHandler(async (event) => {
  const force = getQuery(event).force === 'true'
  return getRouteDataSourceStatus(force)
})
