# ── Stage 1: Install dependencies ──
FROM node:20-slim AS deps
RUN corepack enable && corepack prepare pnpm@10.30.2 --activate
WORKDIR /app
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
COPY tsconfig.base.json ./
COPY apps/api apps/api
COPY packages/sdk packages/sdk
COPY pnpm-workspace.yaml package.json ./
RUN pnpm --filter api build

# ── Stage 3: Fetch secrets (intermediate — discarded from final image) ──
FROM amazon/aws-cli:latest AS secrets
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_DEFAULT_REGION
RUN aws secretsmanager get-secret-value \
      --secret-id atv-sdk \
      --region us-east-1 \
      --output text \
      --query SecretString \
    | python3 -c "import sys,json; [print(f'{k}=\"{v}\"') for k,v in json.loads(sys.stdin.read()).items()]" \
    > /tmp/.env

# ── Stage 4: Production image (no AWS credentials) ──
FROM node:20-slim AS runner
RUN corepack enable && corepack prepare pnpm@10.30.2 --activate
WORKDIR /app

# Copy secrets from intermediate stage (AWS creds never touch this image)
COPY --from=secrets /tmp/.env .env

# Copy workspace config & install production deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/sdk/package.json packages/sdk/
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output.
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/migrations apps/api/migrations

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
