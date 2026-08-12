FROM node:20-alpine AS base

# Optional: trust an extra CA bundle when building behind a TLS-inspecting proxy (some corporate
# or sandboxed dev networks need this for `apk add`/`npm ci` to reach package registries; see
# docker/README.md). The docker/ directory always exists so this COPY never fails, but the actual
# host-ca-bundle.crt file is untracked/local-only — on a normal machine (no proxy, e.g. GitHub
# Actions or another developer's laptop) this is a complete no-op and the default trust store is
# left untouched.
COPY docker/ /tmp/extra-ca/
RUN if [ -s /tmp/extra-ca/host-ca-bundle.crt ]; then \
      cp /tmp/extra-ca/host-ca-bundle.crt /etc/ssl/certs/ca-certificates.crt; \
    fi && rm -rf /tmp/extra-ca
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

RUN apk add --no-cache libc6-compat openssl

# ---- deps (full, incl. devDependencies for prisma CLI + build) ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---- build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:/app/data/build.db"
ENV SESSION_SECRET="build-time-placeholder-secret-not-used-at-runtime"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ---- runtime ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# No outbound calls of any kind at runtime — this app is meant to run in fully offline/intranet
# environments. Verified: migrate + seed + next start all complete fine with zero network access.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data && chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
