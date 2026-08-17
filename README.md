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

## Firebase（Google 登入 + Firestore）

登入用 **Firebase Authentication 的 Google 登入**，資料存 **Firestore**。
前端只負責拿 idToken，驗證與 session 都在後端，瀏覽器不保存任何 token。

### 設定步驟

1. Firebase Console 建立專案 → **Authentication → Sign-in method → 啟用 Google**
2. **Firestore Database → 建立資料庫**（正式模式即可，前端不直連，都走後端）
3. 專案設定 → 一般 → 新增網頁應用程式，把設定值填進 `.env`：

```bash
NUXT_PUBLIC_FIREBASE_API_KEY=...
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=...
NUXT_PUBLIC_FIREBASE_APP_ID=...
```

4. 專案設定 → **服務帳戶 → 產生新的私密金鑰**，下載的 JSON 用 base64 後填進：

```bash
NUXT_FIREBASE_SERVICE_ACCOUNT=$(base64 -i service-account.json)
NUXT_SESSION_PASSWORD=至少 32 字元的隨機字串
```

5. 重新啟動 `npm run dev`（`.env` 改了一定要重啟）

### 登入流程

```
登入頁 →（Firebase SDK）signInWithPopup → idToken
      → POST /api/auth/firebase →（Admin SDK）verifyIdToken
      → 建立/更新使用者 → 加密 session cookie → /home
```

- 第一次登入自動建立帳號，並加入示範家庭，登入後就看得到內容。
- 歡迎頁選的身分存在 `accessity_pending_role` cookie，`/api/auth/firebase` 會套用到新帳號。
- `server/middleware/auth.ts` 讓 `/api/**` 一律需要 session（只放行 `/api/auth/*`），未登入回 401，
  前端 `session.global.ts` 會導回 `/login`。
- **沒設定金鑰也能跑**：資料層會自動退回記憶體模式，登入頁的「先用 Demo 帳號看看」走 `POST /api/auth/demo`。
  正式環境請關掉 demo 登入。

### 資料層

`server/utils/collections.ts` 定義一組集合介面，有 Firestore 與記憶體兩種實作；
`server/utils/repo.ts` 是各資料表的入口，handler 只認 repo，所以要換資料庫只要改這兩個檔案。

| Collection | 內容 | 切分方式 |
| --- | --- | --- |
| `users` | 帳號、角色、無障礙需求、今日需求 | 自己 |
| `families` / `members` | 家庭、成員狀態 | `familyId` |
| `alerts` / `trips` | Care Alert、進行中的行程 | `familyId` |
| `notifications` / `places` / `tripRecords` / `settings` | 通知、常用地點、行程紀錄、通知設定 | `userId` |
| `reports` / `checkins` | 路況回報、Check-in 紀錄 | `userId` |

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
| `/onboarding/welcome`       | **入口頁**：選擇身分（Navigator / Caregiver / Others） |
| `/login`                    | 登入（Google 帳號；另有 Demo 帳號備援）           |
| `/onboarding/role`          | 變更角色（Profile → Change Role 進入）           |
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
| `/home`                     | **主頁**（登入後落地）：被照顧者看現在位置／常用地點／今日狀況／已儲存需求／最近紀錄；照顧者看即時位置與統計 |
| `/mimo`                     | Mimo 對話（Requirement Agent）                   |
| `/notifications`            | 通知中心（Check-in 詢問、照顧者回覆、路線調整…） |
| `/report`                   | 路況回報（從通知中心或導航頁的 Report Issue 進入）|
| `/profile`                  | 個人檔案                                         |
| `/settings/notifications`   | 通知設定                                         |
| `/caregiver`                | Caregiver Dashboard（家庭、成員列表）            |
| `/caregiver/members/:id`    | 成員詳情（位置、電量、停留提醒、通知開關）       |
| `/caregiver/alerts`         | 提醒中心（待處理 / 已處理）                      |
| `/caregiver/alerts/:id`     | 提醒詳情（安全檢查未回覆 / 緊急求助 / 長時間停留）|

Demo 動線：`/`（自動導到 `/onboarding/welcome` 選身分）→ `/login` → `/home`（兩種角色都落在主頁）。
- 被照顧者：`/home`（現在位置／常用地點／今日狀況）→ `/map/plan?to=台大醫院` → `/map/routes` → `/map/navigate` → `/map/arrived`
- 照顧者：`/home`（需要注意的提醒 → 關注對象切換 → 即時位置 → 統計）→ `Members` 分頁 `/caregiver` → 成員詳情 → `Alerts` 分頁 `/caregiver/alerts` → 提醒詳情回覆
- 走註冊：`/login` → Sign Up → 需求勾選 → 連結照顧者 / 家庭代碼 → 主頁

身分在第一頁就選好，存在 session 的 `pendingRole`，登入或註冊成功後才寫回帳號（`PATCH /api/me`）。

底部分頁依角色不同：被照顧者是 `Map / Notification / Home / Mimo / Profile`，照顧者是 `Home / Members / Alerts / Mimo / Profile`。
紅點分別來自 `useNotifications()`（被照顧者的未讀通知）與 `useAlerts()`（照顧者的未處理提醒），
兩者都是共用狀態，讀取或回覆之後導覽列與各頁面會同步更新。

Demo 想切換成照顧者：用 `naijia@example.com` 登入（後端 `POST /api/auth/login` 會回傳照顧者帳號）。

導航頁左下角有 **「模擬停留 15 分鐘」** 按鈕（`<SafetyOverlay demo />`），用來在 demo 時觸發 Check-in 對話框；其他畫面只會顯示 SOS 浮動按鈕。

被照顧者的需求分兩層：**固定需求**（輪椅／視障／行動協助，存在帳號上）與 **今日需求**（今天腳痠、想避開施工…，主頁一鍵切換、只在當天有效）。兩者都會一起送進 `GET /api/routes`。

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

### 企劃書對照

| 企劃書項目 | 現況 |
| --- | --- |
| §4.1 AI 需求輸入（文字／語音／快捷） | ✅ Gemini Requirement Agent + Web Speech 語音輸入 + 範例句 |
| §4.2 固定需求 / 今日需求 | ✅ 帳號上的固定需求 + 首頁的今日狀況（當天有效） |
| §4.3 Google Maps 導航 | ⚠️ 尚未串接（缺 API key），目前是 `MapCanvas` 示意底圖 |
| §4.4 施工感知導航 | ✅ 後端 `routes.get.ts` 用施工資料做路段比對、重新排序並產生推薦理由 |
| §4.5 Voice-first | ✅ TTS 逐步播報 + Replay（再聽一次）+ Help（需要協助）+ 大按鈕 |
| §4.6 Care Dashboard | ✅ On trip / Destination / ETA / 即時位置 / Trip Timeline（成員詳情） |
| §4.7 Detect → Ask → Wait → Escalate | ✅ 停留詢問 + 倒數等待 + 逾時自動升級 Care Alert |
| §5 三個 Agent | ✅ Requirement（Gemini）／Navigation（施工比對）／Care（Check-in 升級） |
| §6 被照顧者 Home / 導航畫面 | ✅ 現在位置、常用地點、已儲存需求、最近行程、施工標示 |
| §7 照顧者 Dashboard | ✅ 提醒中心、成員切換、即時位置、統計 |

剩下最大的一項是 **Google Maps 串接**：`nuxt.config.ts` 已留 `googleMapsKey`，
把 `MapCanvas` 換成 Google Maps JS API、路線改用 Routes API 的 polyline 即可。

其他 `TODO` 標註的整合點：

- **Google Maps**：`app/components/MapCanvas.vue`（目前是 CSS + SVG 示意底圖）、`nuxt.config.ts` 的 `googleMapsKey`。
- **語音**：`app/pages/map/index.vue`、`app/pages/mimo.vue`（STT）、`app/pages/map/navigate.vue`（TTS 播報）。
- **LLM**：`server/api/agent/requirement.post.ts`（目前是關鍵字規則，之後換成 Claude Messages API 的結構化輸出）。
- **推播 / 即時更新**：`server/api/alerts/*`、`app/pages/caregiver/*`（目前是輪詢式 `useAsyncData`，正式版建議 SSE 或推播）。
- **Mimo 角色圖**：正式插畫在 `public/mimo.png`（384px，大尺寸用）與 `public/mimo-icon.png`（96px，小頭像／favicon 用），
  由 `app/components/MimoMascot.vue` 依 size 自動挑檔；要換角色圖直接換這兩個檔案。

---

## 後端 API 一覽（`server/api`）

| Method | 路徑                              | 說明                             |
| ------ | --------------------------------- | -------------------------------- |
| GET    | `/api/auth/google`                | Google OAuth 登入 / 回呼         |
| POST   | `/api/auth/demo`                  | Demo 帳號登入（沒有 Google 金鑰時備援）|
| POST   | `/api/auth/logout`                | 登出（清除 session cookie）      |
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
| GET    | `/api/construction`               | 城市施工路段                     |
| GET    | `/api/shelters`                   | 避難所可達性                     |
| GET    | `/api/places`                     | 常用地點（首頁一鍵導航）         |
| GET    | `/api/needs/today`                | 今日需求選項                     |
| PATCH  | `/api/needs/today`                | 更新今日需求（當天有效）         |
| GET    | `/api/trips/recent`               | 最近行程紀錄                     |
| GET    | `/api/trips/current`              | 進行中的行程                     |
| GET    | `/api/trips/overview`             | 本週統計                         |
| POST   | `/api/trips`                      | 開始行程                         |
| POST   | `/api/trips/:id/end`              | 結束行程                         |
| GET    | `/api/alerts`                     | 提醒列表                         |
| POST   | `/api/alerts/sos`                 | 送出 SOS                         |
| POST   | `/api/alerts/:id/respond`         | 照顧者回覆（正在前往 / 已收到）  |
| POST   | `/api/checkin`                    | Check-in 回覆（ok / need-help / no-response 逾時升級）|
| POST   | `/api/reports`                    | 路況回報                         |
| GET    | `/api/notifications`              | 通知清單                         |
| POST   | `/api/notifications/:id/read`     | 標記單則已讀                     |
| POST   | `/api/notifications/read-all`     | 全部標記已讀                     |
| GET    | `/api/settings/notifications`     | 通知設定                         |
| PATCH  | `/api/settings/notifications`     | 更新通知設定                     |

後端資料存在 `server/utils/store.ts` 的記憶體物件，重啟即回到初始狀態；
要換成真的資料庫時，只需替換這個檔案並保持 handler 介面不變。
