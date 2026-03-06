import { EvmChain } from "@moralisweb3/common-evm-utils";
import qs from "qs";
import { env } from "../config/env";
import {
  DepositContractType,
  IAtvVault,
  IContractEntry,
  ProductId,
  WithdrawType,
} from "../types/vault.types";

interface StrapiProductItem {
  id: number;
  productId: string;
  productUsp: string;
  afiTokenAddress: string;
  chainId: number;
  productType: number;
  timelockContractType?: string;
  depositContractType?: string;
  withdrawType?: string[];
  depositFee?: number;
  title?: string;
  isLive?: boolean;
  contracts?: Array<{
    id: number;
    label: string;
    address: string;
    abi: any[];
  }>;
  [key: string]: any;
}

interface StrapiProductsResponse {
  data: StrapiProductItem[];
  meta?: { pagination?: { total: number } };
}

/**
 * CMS service — fetches vault configs from Strapi with an in-memory TTL cache.
 *
 * In production (NODE_ENV=production) only vaults with isLive=true are returned.
 * In development all vaults are returned regardless of isLive.
 *
 * Force-refresh: call cmsService.invalidateCache() to bust the cache immediately.
 */
class CmsService {
  private cache: { vaults: IAtvVault[]; fetchedAt: number } | null = null;

  private get ttl(): number {
    return env.STRAPI_CACHE_TTL_MS;
  }

  private get isCacheValid(): boolean {
    return !!this.cache && Date.now() - this.cache.fetchedAt < this.ttl;
  }

  invalidateCache(): void {
    this.cache = null;
  }

  async getVaults(): Promise<IAtvVault[]> {
    // if (this.isCacheValid) {
    //   return this.cache!.vaults;
    // }

    const vaults = await this.fetchFromCms();
    this.cache = { vaults, fetchedAt: Date.now() };
    return vaults;
  }

  private async fetchFromCms(): Promise<IAtvVault[]> {
    const query = qs.stringify(
      {
        populate: {
          contracts: true,
        },
      },
      { encodeValuesOnly: true },
    );

    const url = `${env.STRAPI_URL}/afi-products?${query}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (env.STRAPI_API_TOKEN) {
      headers["Authorization"] = `Bearer ${env.STRAPI_API_TOKEN}`;
    }

    let response: Response;
    try {
      response = await fetch(url, { headers });
    } catch (err: any) {
      throw new Error(
        `Failed to reach Strapi at ${env.STRAPI_URL}: ${err.message}`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `Strapi returned HTTP ${response.status} for ${url}. Check STRAPI_URL and STRAPI_API_TOKEN.`,
      );
    }

    const body = (await response.json()) as StrapiProductsResponse;

    if (!Array.isArray(body?.data)) {
      throw new Error(
        `Unexpected Strapi response shape — expected { data: [] }. ` +
          `Got: ${JSON.stringify(body).slice(0, 200)}`,
      );
    }

    return body.data
      .filter((vault) => vault.isLive)
      .map((vault) => this.tryMapItem(vault))
      .filter((v): v is IAtvVault => v !== null);
  }

  /**
   * Maps a single afi-products item to IAtvVault.
   * Returns null (with a warning) if required contracts are missing or chainId
   * is unsupported, so one bad item doesn't break the entire vault list.
   */
  private tryMapItem(item: StrapiProductItem): IAtvVault | null {
    // Convert contracts array → dict keyed by label.
    // Addresses are normalised to lowercase at ingestion so all downstream
    // comparisons (vault map lookups, approve spender checks, etc.) are
    // case-insensitive by default — no per-call .toLowerCase() required.
    const normaliseAddress = (addr: string) => addr.trim().toLowerCase();

    const contracts = (item.contracts ?? []).reduce(
      (acc: Record<string, IContractEntry>, contract) => ({
        ...acc,
        [contract.label]: {
          address: normaliseAddress(contract.address),
          abi: contract.abi,
        },
      }),
      {},
    );

    let chain: EvmChain;
    try {
      chain = EvmChain.create(item.chainId);
    } catch {
      console.warn(
        `[CmsService] Skipping vault id=${item.id} (${item.productId}): ` +
          `unsupported chainId=${item.chainId}.`,
      );
      return null;
    }

    return {
      productId: item.productId as ProductId,
      label: item.title ?? item.productUsp,
      afiTokenAddress: normaliseAddress(item.afiTokenAddress),
      chain,
      productType: item.productType,
      timelockContractType: (item.timelockContractType?.toUpperCase() ??
        "NONE") as IAtvVault["timelockContractType"],
      depositContractType:
        (item.depositContractType?.toUpperCase() as DepositContractType) ??
        DepositContractType.ERC20,
      withdrawType: item.withdrawType?.length
        ? (item.withdrawType.map((w) =>
            w.toUpperCase(),
          ) as WithdrawType[])
        : [WithdrawType.INSTANT],
      depositFee: item.depositFee,
      contracts: {
        base: contracts.base,
        factory: contracts.factory,
        storage: contracts.storage,
        ...(contracts.timelock && { timelock: contracts.timelock }),
      },
    };
  }
}

export const cmsService = new CmsService();
