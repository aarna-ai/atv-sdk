import { ethers } from 'ethers';
import { RPC_URLS } from '../config/env';
import { EvmChain } from '../types/vault.types';

/**
 * Singleton helper for all on-chain reads and calldata encoding.
 *
 * Provider pooling: one JsonRpcProvider per chain, lazily initialized and
 * reused across requests. Creating providers per request is expensive and
 * exhausts connection limits under load.
 *
 * Bigint safety: ethers v6 returns native bigint from contract reads.
 * Callers MUST call .toString() before passing values to res.json().
 * JSON.stringify silently drops bigint values.
 */
class EthersHelper {
    private providers: Map<number, ethers.JsonRpcProvider> = new Map();

    private getProvider(chain: EvmChain): ethers.JsonRpcProvider {
        const chainId = chain.decimal;
        if (!this.providers.has(chainId)) {
            const url = RPC_URLS[chainId];
            if (!url) {
                throw new Error(
                    `No RPC URL configured for chainId: ${chainId} (${chain.hex}). Add RPC_URL_* in .env`,
                );
            }
            this.providers.set(chainId, new ethers.JsonRpcProvider(url, undefined, { batchMaxCount: 1 }));
        }
        return this.providers.get(chainId)!;
    }

    /**
     * Call any view/pure function on any contract.
     * Returns the raw result — callers handle type coercion.
     */
    async readContract<T = unknown>(
        address: string,
        abi: string[],
        method: string,
        args: unknown[],
        chain: EvmChain,
    ): Promise<T> {
        const provider = this.getProvider(chain);
        const contract = new ethers.Contract(address, abi, provider);
        const result = await contract[method](...args);
        return result as T;
    }

    /**
     * Encode calldata for a contract call without sending a transaction.
     * Used by deposit/withdraw services to build transaction objects.
     */
    encodeContractCall(
        address: string,
        abi: string[],
        method: string,
        args: unknown[],
    ): { to: string; data: string } {
        const iface = new ethers.Interface(abi);
        return {
            to: address,
            data: iface.encodeFunctionData(method, args),
        };
    }

    /**
     * Estimate gas for a transaction — useful for the simulate flag.
     */
    async estimateGas(
        tx: { to: string; data: string; value?: string; from?: string },
        chain: EvmChain,
    ): Promise<string> {
        const provider = this.getProvider(chain);
        const estimate = await provider.estimateGas(tx);
        return estimate.toString();
    }
}

export const ethersHelper = new EthersHelper();
