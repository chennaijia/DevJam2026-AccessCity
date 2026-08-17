/** 通用地理計算：解碼 Google 的 encoded polyline、算兩點距離（公尺） */

export function decodePolyline(encoded: string): [number, number][] {
  let index = 0
  let lat = 0
  let lng = 0
  const points: [number, number][] = []

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte: number
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0
    result = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    points.push([lat / 1e5, lng / 1e5])
  }

  return points
}

const EARTH_RADIUS_M = 6371000

export function haversineMeters(a: [number, number], b: [number, number]): number {
  const [lat1, lon1] = a
  const [lat2, lon2] = b
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const la1 = (lat1 * Math.PI) / 180
  const la2 = (lat2 * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/** 每隔約 stepMeters 從 polyline 上取樣一個點，避免每個原始點都檢查（點太密) */
export function samplePolyline(points: [number, number][], stepMeters = 40): [number, number][] {
  if (points.length === 0) return []
  const sampled: [number, number][] = [points[0]!]
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    acc += haversineMeters(points[i - 1]!, points[i]!)
    if (acc >= stepMeters) {
      sampled.push(points[i]!)
      acc = 0
    }
  }
  return sampled
}

/** 從一個點往某個方位角、距離幾公尺外，算出新的座標——用來在障礙點旁邊生出一個繞道用的中繼點 */
export function destinationPoint(
  start: [number, number],
  bearingDeg: number,
  distanceMeters: number,
): [number, number] {
  const R = EARTH_RADIUS_M
  const delta = distanceMeters / R
  const theta = (bearingDeg * Math.PI) / 180
  const phi1 = (start[0] * Math.PI) / 180
  const lambda1 = (start[1] * Math.PI) / 180

  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta),
  )
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2),
    )

  return [(phi2 * 180) / Math.PI, (((lambda2 * 180) / Math.PI + 540) % 360) - 180]
}
