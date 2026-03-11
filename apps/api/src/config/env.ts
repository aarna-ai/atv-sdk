import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.string().default("3000").transform(Number),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  RPC_URL_ETHEREUM: z.string().url().optional(),
  RPC_URL_BASE: z.string().url().optional(),

  // Strapi CMS — source of vault configs
  STRAPI_URL: z.string().url(),
  // Optional bearer token for Strapi API auth (set in Strapi Settings → API Tokens)
  STRAPI_API_TOKEN: z.string().optional(),
  // Strapi REST endpoint path for vaults. Default covers Strapi v4 with full populate.
  STRAPI_VAULTS_PATH: z
    .string()
    .default("/api/afi-vaults?populate[contracts][populate]=*"),
  // How long (ms) to cache the Strapi vault list before re-fetching. Default: 5 min.
  STRAPI_CACHE_TTL_MS: z.string().default("300000").transform(Number),

  // Aarna engine API — source for APY and other computed vault metrics
  ENGINE_API_BASE_URL: z
    .string()
    .url()
    .default("https://engine.aarna.ai/api/v2"),
});

export const env = EnvSchema.parse(process.env);

// Keyed by EVM chainId. Only chains with RPC_URL_* set in .env are available.
// Vaults on unconfigured chains throw a clear error from EthersHelper.
export const RPC_URLS: Partial<Record<number, string>> = {
  1: env.RPC_URL_ETHEREUM,      // Ethereum
  8453: env.RPC_URL_BASE,       // Base
};

