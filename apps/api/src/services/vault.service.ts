import { ethers } from "ethers";
import { EvmChain } from "@moralisweb3/common-evm-utils";
import { vaultRegistry } from "../config/vault-registry";
import erc20Abi from "../config/abis/erc20.abi.json";
import { ethersHelper } from "../helpers/ethers.helper";
import { formatUnits, formatVaultID } from "../utils/format";
import { engineService } from "./engine.service";
import {
  ApyResponse,
  DepositToken,
  ListVaultsQuery,
  NavResponse,
  TvlResponse,
  VaultMetadata,
} from "../types/api.types";
import { IAtvVault } from "../types/vault.types";

export class VaultService {
  private toMetadata(v: IAtvVault, depositTokens: DepositToken[]): VaultMetadata {
    return {
      productId: formatVaultID(v.productId),
      label: v.label,
      address: v.afiTokenAddress,
      chain: v.chain.name ?? v.chain.hex,
      withdrawType: v.withdrawType,
      contractType: v.depositContractType,
      depositTokens,
    };
  }

  async listVaults(query?: ListVaultsQuery): Promise<VaultMetadata[]> {
    const vaults = await vaultRegistry.getVaults();
    const filtered = query?.chain
      ? vaults.filter((v) => {
          const q = query.chain!.toLowerCase();
          return (
            (v.chain.name ?? "").toLowerCase().includes(q) ||
            v.chain.decimal.toString() === query.chain ||
            v.chain.hex === query.chain
          );
        })
      : vaults;

    return Promise.all(
      filtered.map(async (v) =>
        this.toMetadata(v, await this.getDepositTokens(v, query?.userAddress)),
      ),
    );
  }

  async getVault(address: string, userAddress?: string): Promise<VaultMetadata> {
    const v = await vaultRegistry.getVaultOrThrow(address);
    return this.toMetadata(v, await this.getDepositTokens(v, userAddress));
  }

  private async getDepositTokens(
    vault: IAtvVault,
    userAddress?: string,
  ): Promise<DepositToken[]> {
    try {
      let paymentTokenAddresses: string[] = [];

      if (vault.productType === 4) {
        // Leverage vault: single asset via ERC4626 asset()
        const token = await ethersHelper.readContract<string>(
          vault.afiTokenAddress,
          ["function asset() view returns (address)"],
          "asset",
          [],
          vault.chain,
        );
        paymentTokenAddresses.push(token);
      } else {
        // Standard vault: getInputToken() returns (address[] tokens, address[] oTokens)
        const result = await ethersHelper.readContract<[string[], string[]]>(
          vault.afiTokenAddress,
          ["function getInputToken() view returns (address[], address[])"],
          "getInputToken",
          [],
          vault.chain,
        );
        paymentTokenAddresses.push(...result[0]);
      }

      return await Promise.all(
        paymentTokenAddresses.map(async (tokenAddress) => {
          const [name, symbol, decimals, balance, minDepositLimitRaw] =
            await Promise.all([
              ethersHelper.readContract<string>(
                tokenAddress,
                erc20Abi as string[],
                "name",
                [],
                vault.chain,
              ),
              ethersHelper.readContract<string>(
                tokenAddress,
                erc20Abi as string[],
                "symbol",
                [],
                vault.chain,
              ),
              ethersHelper.readContract<bigint>(
                tokenAddress,
                erc20Abi as string[],
                "decimals",
                [],
                vault.chain,
              ),
              userAddress
                ? ethersHelper.readContract<bigint>(
                    tokenAddress,
                    erc20Abi as string[],
                    "balanceOf",
                    [userAddress],
                    vault.chain,
                  )
                : Promise.resolve(0n),
              this.getMinDepositLimit(vault, tokenAddress),
            ]);

          const tokenDecimals = Number(decimals);
          const isBase = vault.chain.apiHex === EvmChain.BASE.apiHex;

          // minDepositLimit from contract:
          //   Base chain  → value is in wei
          //   Other chains → value is human-readable integer
          const formattedMinDepositLimit = isBase
            ? ethers.formatUnits(minDepositLimitRaw, tokenDecimals)
            : minDepositLimitRaw.toString();

          const minDepositLimit = isBase
            ? minDepositLimitRaw.toString()
            : ethers
                .parseUnits(minDepositLimitRaw.toString(), tokenDecimals)
                .toString();

          return {
            name,
            address: tokenAddress.toLowerCase(),
            symbol,
            decimals: tokenDecimals,
            balance: balance.toString(),
            formattedBalance: ethers.formatUnits(balance, tokenDecimals),
            minDepositLimit,
            formattedMinDepositLimit,
          };
        }),
      );
    } catch (e: any) {
      console.warn(
        `[VaultService] getDepositTokens failed for vault ${vault.productId}:`,
        e.message,
      );
      return [];
    }
  }

  private async getMinDepositLimit(
    vault: IAtvVault,
    inputTokenAddress: string,
  ): Promise<bigint> {
    try {
      const vaultAbi = vault.contracts.base.abi;
      const hasMinDepositFunction = vaultAbi.some(
        (item: any) =>
          item.name === "minimumDepositLimit" && item.type === "function",
      );

      if (!hasMinDepositFunction) {
        return 0n;
      }

      const args =
        vault.chain.apiHex === EvmChain.BASE.apiHex ? [inputTokenAddress] : [];

      const result = await ethersHelper.readContract<bigint>(
        vault.afiTokenAddress,
        vaultAbi,
        "minimumDepositLimit",
        args,
        vault.chain,
      );

      return BigInt(result.toString());
    } catch {
      return 0n;
    }
  }

  async getNAV(address: string): Promise<NavResponse> {
    const vault = await vaultRegistry.getVaultOrThrow(address);

    if (vault.productType === 4) {
      // Leverage vault: base.getCurrentNAV() → 18 decimals
      const nav = await ethersHelper.readContract<bigint>(
        vault.contracts.base.address,
        vault.contracts.base.abi,
        "getCurrentNAV",
        [],
        vault.chain,
      );
      return {
        address: vault.afiTokenAddress,
        nav: nav.toString(),
        decimals: 18,
        formattedNav: formatUnits(nav, 18),
        currency: "USD" as const,
      };
    }

    // Standard vault: factory.getPricePerFullShare(afiToken, storage) → 4 decimals
    const nav = await ethersHelper.readContract<bigint>(
      vault.contracts.factory.address,
      vault.contracts.factory.abi,
      "getPricePerFullShare",
      [vault.afiTokenAddress, vault.contracts.storage.address],
      vault.chain,
    );
    return {
      address: vault.afiTokenAddress,
      nav: nav.toString(),
      decimals: 4,
      formattedNav: formatUnits(nav, 4),
      currency: "USD" as const,
    };
  }

  async getTVL(address: string): Promise<TvlResponse> {
    const vault = await vaultRegistry.getVaultOrThrow(address);

    if (vault.productType === 4) {
      const tvl = await ethersHelper.readContract<bigint>(
        vault.contracts.base.address,
        vault.contracts.base.abi,
        "getCurrentTVL",
        [],
        vault.chain,
      );
      return {
        address: vault.afiTokenAddress,
        tvl: tvl.toString(),
        decimals: 18,
        formattedTvl: formatUnits(tvl, 18),
        currency: "USD" as const,
      };
    }

    const tvl = await ethersHelper.readContract<bigint>(
      vault.contracts.storage.address,
      vault.contracts.storage.abi,
      "calculatePoolInUsd",
      [vault.afiTokenAddress],
      vault.chain,
    );
    return {
      address: vault.afiTokenAddress,
      tvl: tvl.toString(),
      decimals: 18,
      formattedTvl: formatUnits(tvl, 18),
      currency: "USD" as const,
    };
  }

  async getAPY(address: string): Promise<ApyResponse> {
    const vault = await vaultRegistry.getVaultOrThrow(address);
    const { baseApy, rewardApy, totalApy } = await engineService.getVaultApy(
      vault.afiTokenAddress,
    );
    return { address: vault.afiTokenAddress, baseApy, rewardApy, totalApy };
  }
}

export const vaultService = new VaultService();
