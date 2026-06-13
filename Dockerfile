# ── base ──────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# ── deps: instala dependencias del workspace completo ─────────────────────────
FROM base AS deps

COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json ./apps/web/
RUN npm ci

# ── builder: build de producción con Next.js standalone ──────────────────────
FROM deps AS builder

COPY . .
RUN npm run build --filter=web

# ── production: imagen mínima con el standalone output ────────────────────────
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]

# ── development: hot reload, código montado como volumen ─────────────────────
FROM deps AS development

COPY . .
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "web"]
