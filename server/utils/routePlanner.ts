/**
 * 路線規劃 Agent：在多條候選路線裡，依使用者需求跟已經算好的客觀事實（距離/時間/
 * 無障礙覆蓋率/沿途標籤）選一條 recommended、幫每條寫一句理由。
 * 分數/覆蓋率/施工判斷都是規則算好的事實，Agent 只負責「怎麼權衡 + 講人話」，
 * 不負責生成路況資料本身，避免對無障礙 App 來說最危險的「AI 編造路況」。
 */
import { GoogleGenAI, Type } from '@google/genai'

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    recommendedRouteId: { type: Type.STRING },
    reasons: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          routeId: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['routeId', 'reason'],
      },
    },
  },
  required: ['recommendedRouteId', 'reasons'],
}

const SYSTEM_INSTRUCTION = `你是無障礙導航 App「Accessity」的路線規劃 Agent。
你會收到幾條候選路線的客觀事實（距離、預估時間、無障礙覆蓋率、已知問題/設施標籤）與使用者當下的需求描述。
規則：
1. 只能根據提供的事實做判斷與描述，絕對不可以編造沒有提供的路況、設施或距離。
2. 從「badge 不是 not-recommended」的路線裡，選一條最貼合使用者需求的當 recommendedRouteId；
   如果全部都是 not-recommended，就選 accessibilityScore 較高的那條。
3. 幫每一條路線寫一句繁體中文理由，語氣自然、像在跟使用者對話，並明確呼應使用者的需求
   （例如使用者提到「腳痠」就該提到距離或時間，提到「輪椅」就該提到無障礙覆蓋率或已知問題）。`

export interface RoutePlanningCandidate {
  id: string
  durationMinutes: number
  distanceMeters?: number
  accessibilityScore?: number
  badge: string
  tags: string[]
}

export interface RoutePlan {
  recommendedRouteId: string
  reasons: Record<string, string>
}

/** 只有兩條以上候選路線才需要 Agent 做選擇，一條路線沒什麼好「综合考量」的 */
export async function planRoutes(
  routes: RoutePlanningCandidate[],
  needsSummary: string,
  apiKey?: string,
): Promise<RoutePlan | null> {
  if (routes.length < 2 || !apiKey) return null

  try {
    const ai = new GoogleGenAI({ apiKey })
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: JSON.stringify({ candidateRoutes: routes, userNeeds: needsSummary || '未指定' }),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    })

    const parsed = JSON.parse(result.text ?? '{}') as {
      recommendedRouteId?: string
      reasons?: { routeId: string; reason: string }[]
    }
    if (!parsed.recommendedRouteId) return null

    const reasons: Record<string, string> = {}
    for (const r of parsed.reasons ?? []) reasons[r.routeId] = r.reason
    return { recommendedRouteId: parsed.recommendedRouteId, reasons }
  } catch (err) {
    console.error('[routePlanner] Gemini 路線決策失敗，維持原本的規則排序：', err)
    return null
  }
}
