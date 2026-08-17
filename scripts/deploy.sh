#!/usr/bin/env bash
#
# 把本機 .env 的設定推到 Cloud Run 並部署。
#
#   ./scripts/deploy.sh
#
# server-only 的金鑰走 Secret Manager，NUXT_PUBLIC_* 走一般環境變數
# （本來就會送到瀏覽器，藏起來沒有意義）。
# 這支腳本本身不含任何金鑰，可以安全提交。
#
# 注意：macOS 內建的是 bash 3.2，沒有關聯陣列，所以這裡刻意只用基本語法。
set -euo pipefail

SERVICE=accesscity
REGION=asia-east1
PROJECT_ID=$(gcloud config get-value project)

cd "$(dirname "$0")/.."
[ -f .env ] || { echo "找不到 .env"; exit 1; }

# 從 .env 讀出某個 key 的值（取第一個符合的，值裡的 = 會保留）
env_value() {
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in \#*|"") continue;; esac
    if [ "${line%%=*}" = "$1" ]; then
      printf '%s' "${line#*=}"
      return 0
    fi
  done < .env
}

need() {
  [ -n "$(env_value "$1")" ] || { echo "❌ .env 缺少 $1"; exit 1; }
}
need NUXT_FIREBASE_SERVICE_ACCOUNT
need NUXT_SESSION_PASSWORD
need NUXT_PUBLIC_FIREBASE_API_KEY

echo "▶ 專案 $PROJECT_ID / 區域 $REGION"

echo "▶ 啟用必要的 API…"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com

# --- Secret Manager：server-only 金鑰 -------------------------------------
# 每行是「secret 名稱 .env的key」
SECRET_MAP="
firebase-sa NUXT_FIREBASE_SERVICE_ACCOUNT
session-password NUXT_SESSION_PASSWORD
gemini-key NUXT_GEMINI_API_KEY
routes-key NUXT_GOOGLE_ROUTES_API_KEY
"

PROJECT_NUM=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
RUNTIME_SA="$PROJECT_NUM-compute@developer.gserviceaccount.com"

SECRET_FLAGS=""
while read -r name key; do
  [ -n "$name" ] || continue
  value=$(env_value "$key")
  if [ -z "$value" ]; then
    echo "⚠️  .env 沒有 $key，略過 secret $name"
    continue
  fi

  if gcloud secrets describe "$name" >/dev/null 2>&1; then
    echo "▶ 更新 secret $name"
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=- >/dev/null
  else
    echo "▶ 建立 secret $name"
    printf '%s' "$value" | gcloud secrets create "$name" --data-file=- >/dev/null
  fi

  gcloud secrets add-iam-policy-binding "$name" \
    --member="serviceAccount:$RUNTIME_SA" \
    --role=roles/secretmanager.secretAccessor >/dev/null

  SECRET_FLAGS="${SECRET_FLAGS:+$SECRET_FLAGS@}$key=$name:latest"
done <<EOF
$SECRET_MAP
EOF

# --- 一般環境變數：NUXT_PUBLIC_* 與非敏感設定 -----------------------------
PLAIN_KEYS="
NUXT_PUBLIC_FIREBASE_API_KEY
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NUXT_PUBLIC_FIREBASE_PROJECT_ID
NUXT_PUBLIC_FIREBASE_APP_ID
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NUXT_PUBLIC_FIREBASE_VAPID_KEY
NUXT_PUBLIC_GOOGLE_MAPS_KEY
NUXT_GOOGLE_ROUTES_ORIGIN
"

PLAIN_FLAGS=""
for key in $PLAIN_KEYS; do
  value=$(env_value "$key")
  if [ -n "$value" ]; then
    PLAIN_FLAGS="${PLAIN_FLAGS:+$PLAIN_FLAGS@}$key=$value"
  else
    echo "⚠️  .env 沒有 $key"
  fi
done

# 值裡面可能有逗號，改用 ^@^ 當分隔符（gcloud 的自訂分隔語法）
echo "▶ 部署中…"
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "^@^$PLAIN_FLAGS" \
  --set-secrets "^@^$SECRET_FLAGS"

URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')
echo
echo "✅ 部署完成：$URL"
echo "▶ 檢查後端是否認得 Firebase："
curl -s "$URL/api/auth/config"; echo
echo
echo "如果 googleEnabled 是 true，記得到 Firebase Console → Authentication"
echo "→ Settings → Authorized domains 加入：${URL#https://}"
