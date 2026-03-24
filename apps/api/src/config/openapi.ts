import { env } from "./env";

/**
 * OpenAPI 3.1 specification for the ATV Vault API.
 * Served via Scalar at GET /docs
 */
export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "aarnâ API Reference",
    version: "1.0.0",
    description:
      "Integrate âtv vault deposits and withdrawals without touching contracts directly. All endpoints require an API key issued by the aarnâ team.",
    contact: {
      name: "aarnâ support",
    },
  },
  servers: [
    ...(env.NODE_ENV !== "production"
      ? [{ url: "http://localhost:3000", description: "Local development" }]
      : []),
    {
      url: "https://atv-api.aarna.ai",
      description: "Production",
    },
  ],
  security: [{ ApiKeyAuth: [] }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description:
          "Your ATV API key. Contact the aarnâ team to obtain one. Keys are prefixed `atv_`.",
      },
    },
    schemas: {
      // ---- Shared shapes ----
      ApiError: {
        type: "object",
        properties: {
          error: { type: "string", example: "Vault not found: 0xABC" },
          statusCode: { type: "integer", example: 404 },
        },
        required: ["error", "statusCode"],
      },
      DepositToken: {
        type: "object",
        properties: {
          name: { type: "string", example: "USD Coin" },
          address: { type: "string", example: "0xusdc..." },
          symbol: { type: "string", example: "USDC" },
          decimals: { type: "integer", example: 6 },
          balance: {
            type: "string",
            example: "1000000",
            description:
              'User\'s raw wei balance ("0" when userAddress not provided)',
          },
          formattedBalance: {
            type: "string",
            example: "1.00",
            description: "Human-readable balance",
          },
          minDepositLimit: {
            type: "string",
            example: "100000000",
            description: 'Minimum deposit amount in wei ("0" = no minimum)',
          },
          formattedMinDepositLimit: {
            type: "string",
            example: "100",
            description: "Minimum deposit amount in human-readable form",
          },
        },
        required: [
          "name",
          "address",
          "symbol",
          "decimals",
          "balance",
          "formattedBalance",
          "minDepositLimit",
          "formattedMinDepositLimit",
        ],
      },
      VaultMetadata: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            example: "âtvUSDC",
            description: "Formatted vault identifier",
          },
          label: {
            type: "string",
            example: "ATV USDC Vault",
          },
          address: {
            type: "string",
            example: "0xabc123...",
            description: "Vault token (atvToken) contract address",
          },
          chain: {
            type: "string",
            enum: ["ethereum", "base"],
            example: "base",
          },
          depositTokens: {
            type: "array",
            items: { $ref: "#/components/schemas/DepositToken" },
            description: "Tokens accepted for deposit into this vault",
          },
        },
        required: ["productId", "label", "address", "chain", "depositTokens"],
      },
      NavResponse: {
        type: "object",
        properties: {
          address: { type: "string", example: "0xabc123..." },
          nav: {
            type: "string",
            example: "10432",
            description:
              "Raw NAV as a string. Standard vaults use 4 decimals (10432 = 1.0432), leverage vaults use 18 decimals.",
          },
          formattedNav: {
            type: "string",
            example: "1.04",
            description: "Human-readable NAV rounded to 2 decimal places",
          },
          decimals: {
            type: "integer",
            example: 4,
            description: "4 for standard vaults, 18 for leverage vaults",
          },
          currency: {
            type: "string",
            enum: ["USD"],
            example: "USD",
          },
        },
        required: ["address", "nav", "formattedNav", "decimals", "currency"],
      },
      TvlResponse: {
        type: "object",
        properties: {
          address: { type: "string", example: "0xabc123..." },
          tvl: {
            type: "string",
            example: "5000000000000000000000000",
            description: "Raw TVL as a string",
          },
          decimals: {
            type: "integer",
            example: 18,
            description: "Decimal places of the raw tvl value (always 18)",
          },
          formattedTvl: {
            type: "string",
            example: "5000000.00",
            description: "Human-readable TVL rounded to 2 decimal places",
          },
          currency: {
            type: "string",
            enum: ["USD"],
            example: "USD",
          },
        },
        required: ["address", "tvl", "decimals", "formattedTvl", "currency"],
      },
      ApyResponse: {
        type: "object",
        properties: {
          address: { type: "string", example: "0xabc123..." },
          baseApy: {
            type: "string",
            example: "10.58",
            description:
              'Native vault yield as a percentage string (e.g. "10.58" = 10.58%)',
          },
          rewardApy: {
            type: "string",
            example: "10.58",
            description: "On-top ASRT reward token APY as a percentage string",
          },
          totalApy: {
            type: "string",
            example: "21.16",
            description: 'Sum of baseApy and rewardApy (e.g. "21.16" = 21.16%)',
          },
        },
        required: ["address", "baseApy", "rewardApy", "totalApy"],
      },
      VaultStatusResponse: {
        type: "object",
        properties: {
          vaultAddress: { type: "string", example: "0xabc123..." },
          isPaused: {
            type: "boolean",
            example: false,
            description: "Whether the operation is currently paused on-chain",
          },
          supported: {
            type: "boolean",
            example: true,
            description:
              "False when the vault contract does not expose the status function — treat as operational in that case",
          },
        },
        required: ["vaultAddress", "isPaused", "supported"],
      },
      TxStep: {
        type: "object",
        description:
          "A single transaction step ready to submit to the blockchain. Steps must be executed in ascending `step` order. The `type` field lets clients handle each step programmatically — for example, skip `approve` if the user already has sufficient allowance.",
        properties: {
          step: {
            type: "integer",
            example: 1,
            description:
              "Execution order (1-indexed). Send all steps in ascending order.",
          },
          label: {
            type: "string",
            example: "Approve ATV USDC Vault deposit",
            description:
              "Human-readable label suitable for display in wallet UIs or transaction history.",
          },
          type: {
            type: "string",
            enum: [
              "approve",
              "deposit",
              "withdraw",
              "stake",
              "unstake",
              "queue_withdraw",
              "unqueue_withdraw",
              "redeem_withdraw",
            ],
            example: "approve",
            description:
              "Transaction step type (enum `TxStepType`):\n\n" +
              "- `approve` — ERC20 allowance grant. Safe to skip if sufficient allowance exists.\n" +
              "- `deposit` — Transfers tokens into the vault.\n" +
              "- `withdraw` — Redeems vault shares for an output token.\n" +
              "- `stake` — Locks vault tokens in a timelock contract.\n" +
              "- `unstake` — Unlocks staked vault tokens.\n" +
              "- `queue_withdraw` — Initiates a queued (delayed) withdrawal.\n" +
              "- `unqueue_withdraw` — Cancels a pending queued withdrawal.\n" +
              "- `redeem_withdraw` — Claims a completed queued withdrawal.",
          },
          to: {
            type: "string",
            example: "0xContractAddress...",
            description: "Target contract address",
          },
          data: {
            type: "string",
            example: "0xa9059cbb000...",
            description: "ABI-encoded calldata",
          },
          value: {
            type: "string",
            example: "0",
            description:
              'ETH value to send (always "0" for ERC20 token vaults)',
          },
          from: {
            type: "string",
            example: "0xUserAddress...",
            description:
              "Sender address — this address must sign and submit the transaction",
          },
          chainId: {
            type: "integer",
            example: 8453,
            description:
              "EVM chain ID. Ensure your wallet is connected to this chain before sending.",
          },
        },
        required: [
          "step",
          "label",
          "type",
          "to",
          "data",
          "value",
          "from",
          "chainId",
        ],
      },
    },
    // Reusable response wrappers
    responses: {
      Unauthorized: {
        description: "Missing or invalid API key",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
            example: {
              error:
                "Missing API key. Provide a valid key in the x-api-key header.",
              statusCode: 401,
            },
          },
        },
      },
      RateLimited: {
        description: "Rate limit exceeded for your API key tier",
        headers: {
          "X-RateLimit-Limit": {
            schema: { type: "integer" },
            description: "Maximum requests allowed per minute for your tier",
          },
          "X-RateLimit-Remaining": {
            schema: { type: "integer" },
            description: "Requests remaining in the current window",
          },
          "X-RateLimit-Reset": {
            schema: { type: "integer" },
            description: "Unix timestamp when the rate limit window resets",
          },
        },
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
            example: {
              error:
                "Rate limit exceeded. See X-RateLimit-Reset for when your limit resets.",
              statusCode: 429,
              retryAfter: 60,
            },
          },
        },
      },
      NotFound: {
        description: "Vault not found for the provided address",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
            example: { error: "Vault not found: 0xABC", statusCode: 404 },
          },
        },
      },
      BadRequest: {
        description:
          "Missing/invalid parameters or a failed pre-flight check (deposits paused, insufficient balance, etc.)",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
            examples: {
              missingParam: {
                summary: "Missing required parameter",
                value: {
                  error:
                    "Missing required query params: userAddress, vaultAddress, depositTokenAddress, depositAmount",
                  statusCode: 400,
                },
              },
              insufficientBalance: {
                summary: "Insufficient wallet balance",
                value: {
                  error:
                    "Insufficient USDC balance: wallet has 0.50 USDC but deposit requires 1.00 USDC",
                  statusCode: 400,
                },
              },
              depositsPaused: {
                summary: "Vault deposits paused",
                value: {
                  error: "Deposits are currently paused for this vault",
                  statusCode: 400,
                },
              },
            },
          },
        },
      },
    },
    // Reusable parameters
    parameters: {
      VaultAddress: {
        name: "address",
        in: "path",
        required: true,
        description: "Vault token (atvToken) contract address",
        schema: { type: "string", example: "0xabc123..." },
      },
    },
  },

  // ---- Paths ----
  paths: {
    "/v1/vaults": {
      get: {
        summary: "List vaults",
        description:
          "Returns all available ATV vaults, optionally filtered by chain.",
        operationId: "listVaults",
        tags: ["Vaults"],
        parameters: [
          {
            name: "chain",
            in: "query",
            required: false,
            description: "Filter vaults by chain",
            schema: {
              type: "string",
              enum: ["ethereum", "base"],
            },
          },
          {
            name: "userAddress",
            in: "query",
            required: false,
            description:
              "User wallet address. When provided, each deposit token in the response includes the user's live balance for that token.",
            schema: { type: "string", example: "0xYourWalletAddress..." },
          },
        ],
        responses: {
          "200": {
            description: "List of vaults",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/VaultMetadata" },
                    },
                    message: { type: "string", example: "Vaults retrieved" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/vaults/{address}": {
      get: {
        summary: "Get vault",
        description:
          "Returns metadata and deposit tokens for a single vault by its address.",
        operationId: "getVault",
        tags: ["Vaults"],
        parameters: [
          { $ref: "#/components/parameters/VaultAddress" },
          {
            name: "userAddress",
            in: "query",
            required: false,
            description:
              "User wallet address. When provided, each deposit token includes the user's live balance.",
            schema: { type: "string", example: "0xYourWalletAddress..." },
          },
        ],
        responses: {
          "200": {
            description: "Vault metadata",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/VaultMetadata" },
                    message: { type: "string", example: "Vault retrieved" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/vaults/{address}/nav": {
      get: {
        summary: "Get vault NAV",
        description:
          "Returns the current Net Asset Value (NAV / price per share) of a vault. Standard vaults return 4-decimal values; leverage vaults return 18-decimal values.",
        operationId: "getVaultNAV",
        tags: ["Vaults"],
        parameters: [{ $ref: "#/components/parameters/VaultAddress" }],
        responses: {
          "200": {
            description: "Current NAV",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/NavResponse" },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/vaults/{address}/tvl": {
      get: {
        summary: "Get vault TVL",
        description:
          "Returns the current Total Value Locked (TVL) in USD for a vault (18 decimals, as a string).",
        operationId: "getVaultTVL",
        tags: ["Vaults"],
        parameters: [{ $ref: "#/components/parameters/VaultAddress" }],
        responses: {
          "200": {
            description: "Current TVL",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/TvlResponse" },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/vaults/{address}/apy": {
      get: {
        summary: "Get vault APY",
        description:
          'Returns the current Annual Percentage Yield for a vault as a percentage string (e.g. "12.45" = 12.45%).',
        operationId: "getVaultAPY",
        tags: ["Vaults"],
        parameters: [{ $ref: "#/components/parameters/VaultAddress" }],
        responses: {
          "200": {
            description: "Current APY",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/ApyResponse" },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/vaults/tvl": {
      get: {
        summary: "Get platform TVL",
        description:
          "Returns the total TVL across all vaults, sourced from the Aarna engine database.",
        operationId: "getTotalTvl",
        tags: ["Analytics"],
        parameters: [],
        responses: {
          "200": {
            description: "TVL data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "object" },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/vaults/{address}/deposit-status": {
      get: {
        summary: "Get deposit status",
        description: "Check whether deposits are currently paused on a vault. Use this before building a deposit transaction.",
        operationId: "getDepositStatus",
        tags: ["Status"],
        parameters: [{ $ref: "#/components/parameters/VaultAddress" }],
        responses: {
          "200": {
            description: "Deposit status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/VaultStatusResponse" },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/vaults/{address}/withdraw-status": {
      get: {
        summary: "Get withdraw status",
        description: "Check whether withdrawals are currently paused on a vault.",
        operationId: "getWithdrawStatus",
        tags: ["Status"],
        parameters: [{ $ref: "#/components/parameters/VaultAddress" }],
        responses: {
          "200": {
            description: "Withdraw status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/VaultStatusResponse" },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/vaults/{address}/queue-withdraw-status": {
      get: {
        summary: "Get queue-withdraw status",
        description: "Check whether queued (delayed) withdrawals are currently paused on a vault.",
        operationId: "getQueueWithdrawStatus",
        tags: ["Status"],
        parameters: [{ $ref: "#/components/parameters/VaultAddress" }],
        responses: {
          "200": {
            description: "Queue withdraw status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/VaultStatusResponse" },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/vaults/{address}/portfolio": {
      get: {
        summary: "Get vault portfolio",
        description: "Returns the underlying token portfolio and breakdown data for a vault from the Aarna engine database.",
        operationId: "getVaultPortfolio",
        tags: ["Analytics"],
        parameters: [{ $ref: "#/components/parameters/VaultAddress" }],
        responses: {
          "200": {
            description: "Vault portfolio data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "object" },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/vaults/{address}/historical-nav": {
      get: {
        summary: "Get historical NAV",
        description: "Returns historical NAV data points for a vault over a specified period. Each data point contains a timestamp and NAV value.",
        operationId: "getHistoricalNav",
        tags: ["Analytics"],
        parameters: [
          { $ref: "#/components/parameters/VaultAddress" },
          {
            name: "days",
            in: "query",
            required: false,
            description: "Period of history: 7, 30, 60, 360, or 'max' (default: 30)",
            schema: { type: "string", example: "30", default: "30", enum: ["7", "30", "60", "360", "max"] },
          },
        ],
        responses: {
          "200": {
            description: "Historical NAV data points",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          timestamp: { type: "integer", description: "Unix timestamp in milliseconds" },
                          nav: { type: "string", description: "NAV value as a decimal string" },
                        },
                      },
                    },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/vaults/{address}/historical-tvl": {
      get: {
        summary: "Get historical TVL",
        description: "Returns historical TVL data points for a vault over a specified period. Each data point contains a timestamp and TVL value.",
        operationId: "getHistoricalTvl",
        tags: ["Analytics"],
        parameters: [
          { $ref: "#/components/parameters/VaultAddress" },
          {
            name: "days",
            in: "query",
            required: false,
            description: "Period of history: 7, 30, 60, 360, or 'max' (default: 30)",
            schema: { type: "string", example: "30", default: "30", enum: ["7", "30", "60", "360", "max"] },
          },
        ],
        responses: {
          "200": {
            description: "Historical TVL data points",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          timestamp: { type: "integer", description: "Unix timestamp in milliseconds" },
                          tvl: { type: "string", description: "TVL value as a decimal string" },
                        },
                      },
                    },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/deposit-tx": {
      get: {
        summary: "Build deposit transaction",
        description:
          "Returns an ordered array of `TxStep` objects to execute a vault deposit. Pre-flight checks are run server-side before any calldata is built:\n\n- **Deposits paused** — 400 if the vault has deposits paused\n- **Insufficient balance** — 400 with a human-readable message if the user's wallet balance is below the requested amount\n- **Allowance check** — the `approve` step is **only included when the user's current allowance is below the deposit amount** (saves gas for repeat depositors)\n\nResponse contains **1 or 2 steps**:\n- 1 step  → deposit only (allowance already sufficient)\n- 2 steps → approve first, then deposit\n\nAlways execute steps in ascending `step` order. All amounts are in **wei**. Ensure your wallet is on the `chainId` returned in each step.",
        operationId: "buildDepositTx",
        tags: ["Transactions"],
        parameters: [
          {
            name: "userAddress",
            in: "query",
            required: true,
            description: "Address of the user making the deposit",
            schema: { type: "string", example: "0xUserAddress..." },
          },
          {
            name: "vaultAddress",
            in: "query",
            required: true,
            description: "Vault token (atvToken) address to deposit into",
            schema: { type: "string", example: "0xVaultAddress..." },
          },
          {
            name: "depositTokenAddress",
            in: "query",
            required: true,
            description: "Address of the ERC20 token to deposit",
            schema: { type: "string", example: "0xUSDCAddress..." },
          },
          {
            name: "depositAmount",
            in: "query",
            required: true,
            description:
              'Human-readable amount to deposit. Example: "100" = 100 USDC. The API converts to wei internally using the token\'s decimals.',
            schema: { type: "string", example: "100" },
          },
        ],
        responses: {
          "200": {
            description: "Ordered deposit steps (approve → deposit)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      minItems: 1,
                      maxItems: 2,
                      items: { $ref: "#/components/schemas/TxStep" },
                      description:
                        "1 step (deposit only) when allowance is sufficient; 2 steps (approve → deposit) when it is not. Always execute in ascending step order.",
                    },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/withdraw-tx": {
      get: {
        summary: "Build withdraw transaction",
        description:
          'Returns a `TxStep` array for a standard vault withdrawal. The user redeems vault shares in exchange for an output token.\n\n- **step 1** (`type: "withdraw"`) — redeems shares for the output token\n\n`minOut` is calculated server-side from the `slippage` parameter using bigint basis-point math. Ensure your wallet is on the `chainId` returned in the step.',
        operationId: "buildWithdrawTx",
        tags: ["Transactions"],
        parameters: [
          {
            name: "userAddress",
            in: "query",
            required: true,
            schema: { type: "string", example: "0xUserAddress..." },
          },
          {
            name: "vaultAddress",
            in: "query",
            required: true,
            description: "Vault token address to withdraw from",
            schema: { type: "string", example: "0xVaultAddress..." },
          },
          {
            name: "oTokenAddress",
            in: "query",
            required: true,
            description: "Output token address to receive on withdrawal",
            schema: { type: "string", example: "0xUSDCAddress..." },
          },
          {
            name: "sharesToWithdraw",
            in: "query",
            required: true,
            description:
              'Human-readable number of vault shares to redeem. Example: "100" = 100 shares. The API converts to wei internally using the share token\'s decimals.',
            schema: { type: "string", example: "100" },
          },
          {
            name: "slippage",
            in: "query",
            required: false,
            description:
              "Slippage tolerance as a percentage (e.g. 0.5 = 0.5%). Defaults to 0.",
            schema: { type: "number", example: 0.5, default: 0 },
          },
          {
            name: "simulate",
            in: "query",
            required: false,
            description:
              "If true, simulates the transaction before returning calldata",
            schema: { type: "boolean", default: false },
          },
        ],
        responses: {
          "200": {
            description: "Withdraw transaction step",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/TxStep" },
                    },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/stake-tx": {
      get: {
        summary: "Build stake transaction",
        description:
          "Returns an ordered array of `TxStep` objects to stake vault tokens into a timelock contract. Pre-flight checks: vault must support staking, user must have sufficient vault token balance.\n\nResponse is 1–2 steps:\n- 1 step → stake only (allowance sufficient)\n- 2 steps → approve then stake",
        operationId: "buildStakeTx",
        tags: ["Transactions"],
        parameters: [
          {
            name: "userAddress",
            in: "query",
            required: true,
            schema: { type: "string", example: "0xUserAddress..." },
          },
          {
            name: "vaultAddress",
            in: "query",
            required: true,
            schema: { type: "string", example: "0xVaultAddress..." },
          },
          {
            name: "lockPeriodIndex",
            in: "query",
            required: true,
            description: "0-indexed lock period from the timelock contract (e.g. 0, 1, 2)",
            schema: { type: "integer", example: 0 },
          },
          {
            name: "stakeAmount",
            in: "query",
            required: true,
            description: 'Human-readable vault token amount to stake (e.g. "100")',
            schema: { type: "string", example: "100" },
          },
        ],
        responses: {
          "200": {
            description: "Ordered stake steps (approve → stake)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/TxStep" } },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/unstake-tx": {
      get: {
        summary: "Build unstake transaction",
        description: "Returns a `TxStep` to unstake vault tokens from a timelock contract.",
        operationId: "buildUnstakeTx",
        tags: ["Transactions"],
        parameters: [
          {
            name: "userAddress",
            in: "query",
            required: true,
            schema: { type: "string", example: "0xUserAddress..." },
          },
          {
            name: "vaultAddress",
            in: "query",
            required: true,
            schema: { type: "string", example: "0xVaultAddress..." },
          },
          {
            name: "stakeIndex",
            in: "query",
            required: true,
            description: "0-indexed position in the user's stake array",
            schema: { type: "integer", example: 0 },
          },
          {
            name: "unstakeAmount",
            in: "query",
            required: true,
            description: 'Human-readable vault token amount to unstake (e.g. "100")',
            schema: { type: "string", example: "100" },
          },
        ],
        responses: {
          "200": {
            description: "Unstake transaction step",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/TxStep" } },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/queue-withdraw-tx": {
      get: {
        summary: "Build queue-withdraw transaction",
        description:
          "Initiates a queued (delayed) withdrawal. The withdrawal must be redeemed separately once it is processed by the vault. Only available on vaults with `STANDARD` or `STANDARD_AUTO_REDEEM` withdraw type.",
        operationId: "buildQueueWithdrawTx",
        tags: ["Transactions"],
        parameters: [
          {
            name: "userAddress",
            in: "query",
            required: true,
            schema: { type: "string", example: "0xUserAddress..." },
          },
          {
            name: "vaultAddress",
            in: "query",
            required: true,
            schema: { type: "string", example: "0xVaultAddress..." },
          },
          {
            name: "tokensToWithdraw",
            in: "query",
            required: true,
            description: 'Human-readable vault share amount to queue for withdrawal (e.g. "100")',
            schema: { type: "string", example: "100" },
          },
          {
            name: "withdrawTokenAddress",
            in: "query",
            required: true,
            description: "Output token address to receive when the withdrawal is redeemed",
            schema: { type: "string", example: "0xUSDCAddress..." },
          },
        ],
        responses: {
          "200": {
            description: "Queue withdraw transaction step",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/TxStep" } },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/unqueue-withdraw-tx": {
      get: {
        summary: "Build unqueue-withdraw transaction",
        description: "Cancels a pending queued withdrawal request.",
        operationId: "buildUnqueueWithdrawTx",
        tags: ["Transactions"],
        parameters: [
          {
            name: "userAddress",
            in: "query",
            required: true,
            schema: { type: "string", example: "0xUserAddress..." },
          },
          {
            name: "vaultAddress",
            in: "query",
            required: true,
            schema: { type: "string", example: "0xVaultAddress..." },
          },
          {
            name: "oTokenAddress",
            in: "query",
            required: true,
            description: "Output token address of the queued request to cancel",
            schema: { type: "string", example: "0xUSDCAddress..." },
          },
          {
            name: "requestId",
            in: "query",
            required: false,
            description: "Specific request ID to cancel (omit to cancel the latest request)",
            schema: { type: "string", example: "1" },
          },
        ],
        responses: {
          "200": {
            description: "Unqueue withdraw transaction step",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/TxStep" } },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/redeem-withdraw-tx": {
      get: {
        summary: "Build redeem-withdraw transaction",
        description: "Claims (redeems) a completed queued withdrawal from a vault.",
        operationId: "buildRedeemWithdrawTx",
        tags: ["Transactions"],
        parameters: [
          {
            name: "userAddress",
            in: "query",
            required: true,
            schema: { type: "string", example: "0xUserAddress..." },
          },
          {
            name: "vaultAddress",
            in: "query",
            required: true,
            schema: { type: "string", example: "0xVaultAddress..." },
          },
          {
            name: "oTokens",
            in: "query",
            required: true,
            description: 'Human-readable amount of output tokens to redeem (e.g. "100")',
            schema: { type: "string", example: "100" },
          },
          {
            name: "batchCounter",
            in: "query",
            required: true,
            description: "Batch identifier from the queue contract for this withdrawal",
            schema: { type: "string", example: "1" },
          },
        ],
        responses: {
          "200": {
            description: "Redeem withdraw transaction step",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/TxStep" } },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },

    "/v1/user-investments": {
      get: {
        summary: "Get user investments",
        description: "Returns a user's portfolio and position data across ATV vaults from the Aarna engine database.",
        operationId: "getUserInvestments",
        tags: ["Analytics"],
        parameters: [
          {
            name: "userAddress",
            in: "query",
            required: true,
            description: "EVM address of the user",
            schema: { type: "string", example: "0xUserAddress..." },
          },
          {
            name: "vaultAddress",
            in: "query",
            required: true,
            description: "Vault contract address",
            schema: { type: "string", example: "0xVaultAddress..." },
          },
        ],
        responses: {
          "200": {
            description: "User investment data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "object" },
                    message: { type: "string" },
                    statusCode: { type: "integer", example: 200 },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
  },

  tags: [
    {
      name: "Vaults",
      description: "Read vault metadata, NAV, TVL, and APY",
    },
    {
      name: "Status",
      description: "Check whether vault operations (deposit, withdraw, queue-withdraw) are paused",
    },
    {
      name: "Transactions",
      description: "Build ready-to-send transaction calldata for deposits, withdrawals, staking, and queued withdrawals",
    },
    {
      name: "Analytics",
      description: "Vault portfolio, historical NAV charts, TVL, and user investment data",
    },
  ],
};
