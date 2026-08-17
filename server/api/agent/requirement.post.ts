import { GoogleGenAI, Type } from '@google/genai'
import type { RequirementChip } from '#shared/types/accessity'

/**
 * Requirement Agent：把一句自然語言變成結構化的導航條件。
 * 用 Gemini 做語意解析，用 responseSchema 強制輸出固定格式。
 */
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    destination: { type: Type.STRING, description: '使用者想去的地點，沒有提到就留空字串' },
    constraints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: {
            type: Type.STRING,
            enum: ['wheelchair', 'mobility', 'avoid-construction', 'voice', 'shade'],
          },
          label: { type: Type.STRING, description: '這個限制的中文短標籤，例如「無障礙路線」' },
        },
        required: ['key', 'label'],
      },
    },
  },
  required: ['destination', 'constraints'],
}

const SYSTEM_INSTRUCTION = `你是無障礙導航 App「Accessity」裡 Mimo 助理的需求解析模組。
從使用者的中文口語描述中解析出：
1. destination：想去的地點（沒提到就回空字串）
2. constraints：無障礙 / 行動 / 路況相關的限制，每一個都用 key + 中文短標籤描述
   - wheelchair：需要輪椅可通行的無障礙路線
   - mobility：行動不便、容易累，需要少走路 / 多休息
   - avoid-construction：想避開施工或封路路段
   - voice：需要語音導航（視障相關）
   - shade：想走遮蔭、避開曝曬的路段
只輸出使用者實際表達出來的限制，不要腦補。`

/** Gemini 額度用盡 / 逾時 / 掛掉時的備用方案，避免 demo 中途整個斷掉 */
const FALLBACK_RULES: { match: RegExp; chip: RequirementChip }[] = [
  { match: /輪椅|無障礙|階梯|電梯/, chip: { key: 'wheelchair', label: '無障礙路線' } },
  { match: /不.{0,2}方便|不好走|痠|酸|累|慢|少走|休息|拐杖/, chip: { key: 'mobility', label: '行動協助' } },
  { match: /施工|封路|圍籬/, chip: { key: 'avoid-construction', label: '避開施工' } },
  { match: /看不到|視障|語音|念/, chip: { key: 'voice', label: '語音導航' } },
  { match: /曬|太陽|熱|遮蔭/, chip: { key: 'shade', label: '遮蔭路線' } },
]

function fallbackParse(input: string): RequirementChip[] {
  const destination = input.match(/(?:去|到)\s*([^\s，,。的]+)/)?.[1]
  const chips: RequirementChip[] = []
  if (destination) chips.push({ key: 'destination', label: destination })
  for (const rule of FALLBACK_RULES) {
    if (rule.match.test(input)) chips.push(rule.chip)
  }
  return chips
}

export default defineEventHandler(async (event): Promise<RequirementChip[]> => {
  const { text } = await readBody<{ text: string }>(event)
  const input = (text ?? '').trim()
  if (!input) return []

  const { geminiApiKey } = useRuntimeConfig(event)
  if (!geminiApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'GEMINI_API_KEY 未設定' })
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey })

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: input,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    })

    const parsed = JSON.parse(result.text ?? '{}') as {
      destination?: string
      constraints?: RequirementChip[]
    }

    const chips: RequirementChip[] = []
    if (parsed.destination) chips.push({ key: 'destination', label: parsed.destination })
    if (Array.isArray(parsed.constraints)) chips.push(...parsed.constraints)
    return chips
  } catch (err) {
    console.error('[agent/requirement] Gemini 呼叫失敗，改用關鍵字規則 fallback：', err)
    return fallbackParse(input)
  }
})
