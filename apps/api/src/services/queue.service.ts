import { ethers } from "ethers";
import { vaultRegistry } from "../config/vault-registry";
import { ethersHelper } from "../helpers/ethers.helper";
import { TxStep, TxStepType } from "../types/api.types";
import { WithdrawType } from "../types/vault.types";
import { formatVaultID } from "../utils/format";

const QUEUE_TYPES = new Set<WithdrawType>([
  WithdrawType.STANDARD,
  WithdrawType.STANDARD_AUTO_REDEEM,
]);

function assertQueueSupported(vaultId: string, withdrawTypes: WithdrawType[]): void {
  if (!withdrawTypes.some((t) => QUEUE_TYPES.has(t))) {
    throw Object.assign(
      new Error(`Vault ${vaultId} does not support queued withdrawals`),
      { statusCode: 400 },
    );
  }
}

export class QueueService {
  /**
   * Build a queue-withdraw transaction step.
   *   queueWithdraw(uint256 tokensToWithdraw, address withdrawToken)
   */
  async buildQueueWithdrawTx(
    userAddress: string,
    vaultAddress: string,
    tokensToWithdraw: string,
    withdrawTokenAddress: string,
  ): Promise<TxStep[]> {
    const vault = await vaultRegistry.getVaultOrThrow(vaultAddress);
    const vaultId = formatVaultID(vault.productId);
    assertQueueSupported(vaultId, vault.withdrawType);

    const decimals = await ethersHelper.readContract<bigint>(
      vault.atvTokenAddress,
      ["function decimals() view returns (uint8)"],
      "decimals",
      [],
      vault.chain,
    );
    const amountBigInt = ethers.parseUnits(tokensToWithdraw, Number(decimals));

    const calldata = ethersHelper.encodeContractCall(
      vault.contracts.base.address,
      vault.contracts.base.abi,
      "queueWithdraw",
      [amountBigInt, withdrawTokenAddress],
    );

    return [
      {
        step: 1,
        label: `Queue withdrawal from ${vaultId}`,
        type: TxStepType.QueueWithdraw,
        ...calldata,
        value: "0",
        from: userAddress,
        chainId: vault.chain.decimal,
      },
    ];
  }

  /**
   * Build an unqueue-withdraw transaction step to cancel a pending request.
   *   unqueueWithdraw(address oToken[, uint256 requestId])
   */
  async buildUnqueueWithdrawTx(
    userAddress: string,
    vaultAddress: string,
    oTokenAddress: string,
    requestId?: string,
  ): Promise<TxStep[]> {
    const vault = await vaultRegistry.getVaultOrThrow(vaultAddress);
    const vaultId = formatVaultID(vault.productId);
    assertQueueSupported(vaultId, vault.withdrawType);

    const args = requestId
      ? [oTokenAddress, BigInt(requestId)]
      : [oTokenAddress];

    const calldata = ethersHelper.encodeContractCall(
      vault.contracts.base.address,
      vault.contracts.base.abi,
      "unqueueWithdraw",
      args,
    );

    return [
      {
        step: 1,
        label: `Cancel queued withdrawal from ${vaultId}`,
        type: TxStepType.UnqueueWithdraw,
        ...calldata,
        value: "0",
        from: userAddress,
        chainId: vault.chain.decimal,
      },
    ];
  }

  /**
   * Build a redeem-withdraw transaction step to claim a completed queued withdrawal.
   *   redeemWithdraw(uint256 oTokens, uint256 batchCounter)
   */
  async buildRedeemWithdrawTx(
    userAddress: string,
    vaultAddress: string,
    oTokens: string,
    batchCounter: string,
  ): Promise<TxStep[]> {
    const vault = await vaultRegistry.getVaultOrThrow(vaultAddress);
    const vaultId = formatVaultID(vault.productId);
    assertQueueSupported(vaultId, vault.withdrawType);

    const decimals = await ethersHelper.readContract<bigint>(
      vault.atvTokenAddress,
      ["function decimals() view returns (uint8)"],
      "decimals",
      [],
      vault.chain,
    );
    const oTokensBigInt = ethers.parseUnits(oTokens, Number(decimals));

    const calldata = ethersHelper.encodeContractCall(
      vault.contracts.base.address,
      vault.contracts.base.abi,
      "redeemWithdraw",
      [oTokensBigInt, BigInt(batchCounter)],
    );

    return [
      {
        step: 1,
        label: `Redeem queued withdrawal from ${vaultId}`,
        type: TxStepType.RedeemWithdraw,
        ...calldata,
        value: "0",
        from: userAddress,
        chainId: vault.chain.decimal,
      },
    ];
  }
}

export const queueService = new QueueService();
