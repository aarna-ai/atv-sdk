import { ethers } from 'ethers';
import { vaultRegistry } from '../config/vault-registry';
import { ethersHelper } from '../helpers/ethers.helper';
import { TxStep, TxStepType } from '../types/api.types';

export class WithdrawService {
    /**
     * Build standard withdraw transaction step.
     *   withdraw(address oToken, uint256 shares, uint256 minOut, address user)
     *
     * slippage is a percentage (e.g. 0.5 = 0.5%), defaults to 0.
     * minOut is calculated server-side using bigint basis-point math.
     */
    async buildWithdrawTx(params: {
        userAddress: string;
        vaultAddress: string;
        oTokenAddress: string;
        sharesToWithdraw: string;
        slippage?: number;
        simulate?: boolean;
    }): Promise<TxStep[]> {
        const vault = await vaultRegistry.getVaultOrThrow(params.vaultAddress);

        // Fetch share token decimals to convert human-readable input to wei
        const shareDecimals = await ethersHelper.readContract<bigint>(
            vault.atvTokenAddress,
            ['function decimals() view returns (uint8)'],
            'decimals',
            [],
            vault.chain,
        );

        const sharesBigInt = ethers.parseUnits(params.sharesToWithdraw, Number(shareDecimals));
        const slippageBps = BigInt(Math.round((params.slippage ?? 0) * 100));
        const minOut = (sharesBigInt * (10000n - slippageBps)) / 10000n;

        const withdrawCalldata = ethersHelper.encodeContractCall(
            vault.contracts.base.address,
            vault.contracts.base.abi,
            'withdraw',
            [params.oTokenAddress, sharesBigInt, minOut, params.userAddress],
        );

        return [
            {
                step: 1,
                label: `Withdraw from ${vault.label}`,
                type: TxStepType.Withdraw,
                ...withdrawCalldata,
                value: '0',
                from: params.userAddress,
                chainId: vault.chain.decimal,
            },
        ];
    }
}

export const withdrawService = new WithdrawService();
