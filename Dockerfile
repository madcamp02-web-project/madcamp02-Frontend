FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 메니페스트만 우선 복사 후 설치 (캐시 활용)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# 애플리케이션 소스 복사 및 빌드
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app

# 런타임 의존성만 설치 (+ Next.js가 TS 기반 설정 파일을 로드할 수 있도록 TypeScript만 추가 설치)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm install --no-save typescript

# 빌드 산출물 및 정적 자산 반영
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

EXPOSE 3000

# Next.js 프로덕션 서버 실행
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
