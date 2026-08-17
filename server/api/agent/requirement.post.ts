import type { RequirementChip } from '#shared/types/accessity'

/**
 * Requirement Agent：把一句自然語言變成結構化的導航條件。
 * 目前用關鍵字規則 demo。
 * TODO: 改成呼叫 LLM（Claude Messages API）並用 tool/JSON schema 限制輸出格式，
 *       回傳 { destination, constraints[], reply }。
 */
const RULES: { match: RegExp; chip: RequirementChip }[] = [
  { match: /輪椅|無障礙|階梯|電梯/, chip: { key: 'wheelchair', label: '無障礙路線' } },
  { match: /不.{0,2}方便|不好走|痠|酸|累|慢|少走|休息|拐杖/, chip: { key: 'mobility', label: '行動協助' } },
  { match: /施工|封路|圍籬/, chip: { key: 'avoid-construction', label: '避開施工' } },
  { match: /看不到|視障|語音|念/, chip: { key: 'voice', label: '語音導航' } },
  { match: /曬|太陽|熱|遮蔭/, chip: { key: 'shade', label: '遮蔭路線' } },
]

export default defineEventHandler(async (event) => {
  const { text } = await readBody<{ text: string }>(event)
  const input = text ?? ''

  // 粗略抓目的地：「去 XXX」「到 XXX」
  const destination = input.match(/(?:去|到)\s*([^\s，,。的]+)/)?.[1] ?? input.trim().slice(0, 12)

  const chips: RequirementChip[] = []
  if (destination) chips.push({ key: 'destination', label: destination })
  for (const rule of RULES) {
    if (rule.match.test(input)) chips.push(rule.chip)
  }

  return chips
})
