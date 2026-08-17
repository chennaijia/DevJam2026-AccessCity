# Nuxt 4 + Nitro（node-server preset）→ Cloud Run
# 建置階段：裝完整依賴、產出 .output
FROM node:22-slim AS build
WORKDIR /app

# 先只複製 lockfile，讓依賴層能被快取。
# --ignore-scripts 是因為 postinstall 的 `nuxt prepare` 需要原始碼，此時還沒複製進來。
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# 執行階段：只帶 .output，映像檔小、啟動快
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Cloud Run 會用 PORT 環境變數告訴容器要監聽哪個埠，Nitro 會自動讀取
ENV PORT=8080

COPY --from=build /app/.output ./.output

EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
