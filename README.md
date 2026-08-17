# AccessCity / Accessity

**AI-powered Accessible Navigation & Care Companion**
_Navigate → Assist → Care_

Nuxt 4（Vue 3）前端 + Nitro（`server/api`）簡易後端。
前端目前全部走**模擬資料**，所有要接後端的位置都以 `// TODO:` 標註。

---

## 快速開始

```bash
npm install --legacy-peer-deps   # npm 10.9 對 nuxt 的 peer deps 有 bug，需要這個旗標
npm run dev                      # http://localhost:3000
```

其他指令：

```bash
npm run build      # 打包
npm run preview    # 預覽打包結果
npm run typecheck  # 型別檢查
```

---

## 專案結構

```
app/
  assets/css/main.css     設計 token（顏色、圓角、陰影、字級）
  components/             共用元件（UiButton / UiCard / UiChip / BottomNav / MapCanvas / Mimo…）
  composables/
    useApi.ts             ★ 前端 ↔ 後端的唯一接口層（含 USE_MOCK 開關與所有 TODO）
    useSession.ts         登入者狀態（角色、需求）
    usePlanning.ts        一趟行程的規劃狀態（目的地 → 需求 chips → 路線 → 導航）
  layouts/default.vue     手機外框
  pages/                  所有畫面
server/
  api/                    簡易後端（Nitro handler，記憶體資料）
  utils/store.ts          記憶體資料庫 + currentUser()
shared/
  types/accessity.ts      前後端共用型別（#shared/types/accessity）
  mock/data.ts            共用模擬資料（前端 mock 與後端初始資料同一份）
```

---

## 畫面（路由對照）

| 路由                        | 畫面                                             |
| --------------------------- | ------------------------------------------------ |
| `/login` `/signup`          | 登入 / 註冊                                      |
| `/onboarding/welcome`       | 歡迎頁角色選擇（Navigator / Caregiver / Others） |
| `/onboarding/role`          | 角色選擇（Person receiving care / Caregiver）    |
| `/onboarding/needs`         | 無障礙需求勾選                                   |
| `/onboarding/connect`       | 被照顧者：連結照顧者（輸入 Family Code）         |
| `/onboarding/join`          | 被照顧者：加入家庭                               |
| `/onboarding/family-code`   | 照顧者：產生 / 分享 Family Code                  |
| `/map`                      | 地圖首頁（搜尋、需求篩選、Mimo、Start Planning） |
| `/map/plan`                 | AI Requirement Confirmation（需求 chips 確認）   |
| `/map/routes`               | Suggested Routes（推薦 / 不推薦 / 替代路線）     |
| `/map/navigate`             | 語音導航中（含 SOS、停留 Check-in）              |
| `/map/arrived`              | Safe Arrival                                     |
| `/shelters`                 | 避難所可達性比較                                 |
| `/home`                     | 首頁（依角色顯示照顧者儀表板或被照顧者首頁）     |
| `/mimo`                     | Mimo 對話（Requirement Agent）                   |
| `/report`                   | 路況回報                                         |
| `/profile`                  | 個人檔案                                         |
| `/settings/notifications`   | 通知設定                                         |
| `/caregiver`                | Caregiver Dashboard（家庭、成員列表）            |
| `/caregiver/members/:id`    | 成員詳情（位置、電量、停留提醒、通知開關）       |
| `/caregiver/alerts/safety`  | Safety Alert（自動安全檢查未回覆）               |
| `/caregiver/alerts/emergency` | Emergency Alert（手動 SOS）                    |

Demo 動線：`/login` →（Sign Up）→ 角色 → 需求 → 連結照顧者 → `/map` → `/map/plan` → `/map/routes` → `/map/navigate` → `/map/arrived`；
照顧者端：`/caregiver` → 成員詳情 → `/caregiver/alerts/safety`。

導航頁與被照顧者首頁左下角有 **「模擬停留 15 分鐘」** 按鈕，用來在 demo 時觸發 Check-in 對話框。

---

## 前端如何接後端

所有 API 呼叫都集中在 [`app/composables/useApi.ts`](app/composables/useApi.ts)：

```ts
const USE_MOCK = true // ← 後端好了就改成 false

async getRoutes(destination, needs) {
  // TODO: 串接後端 —— GET /api/routes?destination=&needs=
  if (!USE_MOCK) return request<RouteOption[]>('/routes', { query: { destination, needs } })
  return mock(mockRoutes)
}
```

- `USE_MOCK = true`：回傳 `shared/mock/data.ts` 的假資料（附 220ms 假延遲）。
- `USE_MOCK = false`：改打 `server/api/**` 的真實 endpoint（已經全部實作好，介面一致）。
- 需要 token / 錯誤處理時，改 `useApi.ts` 裡的 `request()` 一處即可。

其他 `TODO` 標註的整合點：

- **Google Maps**：`app/components/MapCanvas.vue`（目前是 CSS + SVG 示意底圖）、`nuxt.config.ts` 的 `googleMapsKey`。
- **語音**：`app/pages/map/index.vue`、`app/pages/mimo.vue`（STT）、`app/pages/map/navigate.vue`（TTS 播報）。
- **LLM**：`server/api/agent/requirement.post.ts`（目前是關鍵字規則，之後換成 Claude Messages API 的結構化輸出）。
- **推播 / 即時更新**：`server/api/alerts/*`、`app/pages/caregiver/*`（目前是輪詢式 `useAsyncData`，正式版建議 SSE 或推播）。
- **Mimo 角色圖**：`app/components/MimoMascot.vue` 是暫時的 SVG，之後可換成正式插畫（放 `public/`）。

---

## 後端 API 一覽（`server/api`）

| Method | 路徑                              | 說明                             |
| ------ | --------------------------------- | -------------------------------- |
| POST   | `/api/auth/login`                 | 登入（demo 不驗密碼）            |
| POST   | `/api/auth/signup`                | 註冊                             |
| GET    | `/api/me`                         | 目前使用者                       |
| PATCH  | `/api/me`                         | 更新角色 / 無障礙需求 / 基本資料 |
| GET    | `/api/family`                     | 家庭與成員                       |
| POST   | `/api/family/code`                | 重新產生 Family Code             |
| POST   | `/api/family/join`                | 用代碼加入家庭                   |
| POST   | `/api/family/invites/:id/accept`  | 接受邀請                         |
| GET    | `/api/members`                    | 成員列表（照顧者用）             |
| GET    | `/api/members/:id`                | 成員詳情                         |
| PATCH  | `/api/members/:id`                | 停留提醒分鐘數、通知開關         |
| POST   | `/api/agent/requirement`          | Requirement Agent：自然語言 → 需求 chips |
| GET    | `/api/routes`                     | 候選路線（含推薦理由與評分）     |
| GET    | `/api/shelters`                   | 避難所可達性                     |
| GET    | `/api/trips/current`              | 進行中的行程                     |
| GET    | `/api/trips/overview`             | 本週統計                         |
| POST   | `/api/trips`                      | 開始行程                         |
| POST   | `/api/trips/:id/end`              | 結束行程                         |
| GET    | `/api/alerts`                     | 提醒列表                         |
| POST   | `/api/alerts/sos`                 | 送出 SOS                         |
| POST   | `/api/alerts/:id/respond`         | 照顧者回覆（正在前往 / 已收到）  |
| POST   | `/api/checkin`                    | Check-in 回覆（I'm OK / 需要幫忙）|
| POST   | `/api/reports`                    | 路況回報                         |
| GET    | `/api/settings/notifications`     | 通知設定                         |
| PATCH  | `/api/settings/notifications`     | 更新通知設定                     |

後端資料存在 `server/utils/store.ts` 的記憶體物件，重啟即回到初始狀態；
要換成真的資料庫時，只需替換這個檔案並保持 handler 介面不變。
