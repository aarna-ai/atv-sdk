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

# ── Stage 3: Fetch secrets & Production image ──
FROM node:20-slim AS runner
RUN corepack enable && corepack prepare pnpm@10.30.2 --activate

# Install awscli and jq to fetch secrets
RUN apt-get update && apt-get install -y awscli jq && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Accept AWS credentials as build args
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_DEFAULT_REGION

# Set temporarily for aws cli to work during build
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ENV AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION

# Fetch secret from Secrets Manager and create .env
RUN secrets_json=$(aws secretsmanager get-secret-value \
      --secret-id atv-sdk \
      --region us-east-1 \
      --output text \
      --query SecretString) && \
    if [ ! -z "$secrets_json" ]; then \
      echo "$secrets_json" | jq -r 'to_entries | .[] | "\(.key)=\"\(.value | tostring)\""' > .env; \
    fi

# Unset AWS credentials after fetching secrets.
ENV AWS_ACCESS_KEY_ID=""
ENV AWS_SECRET_ACCESS_KEY=""
ENV AWS_DEFAULT_REGION=""

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/sdk/package.json packages/sdk/
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/migrations apps/api/migrations

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
