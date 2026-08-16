# ─── deps: instala as dependências ────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─── builder: builda o Next ─────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* é gravado dentro do bundle JS do navegador durante o build
# do Next.js, não lido em runtime — precisa chegar aqui, antes do
# `npm run build`, senão o Pixel da Meta nunca vê o Pixel ID mesmo com a
# env var certa configurada no EasyPanel só pro container em execução
# (mesmo detalhe do NEXT_PUBLIC_VAPID_PUBLIC_KEY no crm-reobote).
ARG NEXT_PUBLIC_META_PIXEL_ID=""
ENV NEXT_PUBLIC_META_PIXEL_ID=${NEXT_PUBLIC_META_PIXEL_ID}

RUN npm run build

# ─── runner: imagem final, só com o necessário pra rodar ──────────────
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV PORT=3000
EXPOSE 3000

# Sem HEALTHCHECK de propósito — mesmo motivo documentado no Dockerfile do
# crm-reobote: o EasyPanel trata "unhealthy" como gatilho pra matar e
# recriar o container, o que piora o problema em vez de resolver.
CMD ["node", "server.js"]
