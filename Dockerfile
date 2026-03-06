# ── Stage 1: Install dependencies ──
FROM node:20-slim AS deps

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.30.2 --activate

WORKDIR /app

# Copy workspace config + lockfile first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/sdk/package.json packages/sdk/

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ──
FROM node:20-slim AS build

RUN corepack enable && corepack prepare pnpm@10.30.2 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/sdk/node_modules ./packages/sdk/node_modules

# Copy source
COPY tsconfig.base.json ./
COPY apps/api apps/api
COPY packages/sdk packages/sdk
COPY pnpm-workspace.yaml package.json ./

RUN pnpm --filter api build

# ── Stage 3: Production image ──
FROM node:20-slim AS runner

RUN corepack enable && corepack prepare pnpm@10.30.2 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/sdk/package.json packages/sdk/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output
COPY --from=build /app/apps/api/dist apps/api/dist

# Copy migration files so they can be run at deploy time
COPY apps/api/migrations apps/api/migrations

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]
