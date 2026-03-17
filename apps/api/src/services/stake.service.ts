import { ethers } from "ethers";
import { vaultRegistry } from "../config/vault-registry";
import erc20Abi from "../config/abis/erc20.abi.json";
import { ethersHelper } from "../helpers/ethers.helper";
import { TxStep, TxStepType } from "../types/api.types";
import { formatVaultID } from "../utils/format";

export class StakeService {
  /**
   * Build approve + stake transaction steps for a timelock vault.
   *
   * Guardrails:
   *   1. Vault must have a timelock contract (timelockContractType !== "NONE")
   *   2. User must have sufficient vault token (atvToken) balance
   *   3. Approve step omitted when existing allowance is sufficient
   *
   * Response is 1–2 steps:
   *   step N   (type: "approve") — only present when allowance < stakeAmount
   *   step N+1 (type: "stake")   — always present
   */
  async buildStakeTx(
    userAddress: string,
    vaultAddress: string,
    lockPeriodIndex: number,
    stakeAmount: string,
  ): Promise<TxStep[]> {
    const vault = await vaultRegistry.getVaultOrThrow(vaultAddress);
    const vaultId = formatVaultID(vault.productId);
    const chainId = vault.chain.decimal;

    if (vault.timelockContractType === "NONE" || !vault.contracts.timelock) {
      throw Object.assign(
        new Error(`Vault ${vaultId} does not support staking`),
        { statusCode: 400 },
      );
    }

    const timelockAddress = vault.contracts.timelock.address;

    const decimals = await ethersHelper.readContract<bigint>(
      vault.atvTokenAddress,
      ["function decimals() view returns (uint8)"],
      "decimals",
      [],
      vault.chain,
    );
    const amountBigInt = ethers.parseUnits(stakeAmount, Number(decimals));

    // Guardrail: vault token balance
    const balance = await ethersHelper.readContract<bigint>(
      vault.atvTokenAddress,
      ["function balanceOf(address owner) view returns (uint256)"],
      "balanceOf",
      [userAddress],
      vault.chain,
    );
    if (balance < amountBigInt) {
      const have = ethers.formatUnits(balance, Number(decimals));
      const want = ethers.formatUnits(amountBigInt, Number(decimals));
      throw Object.assign(
        new Error(
          `Insufficient vault token balance: wallet has ${have} but stake requires ${want}`,
        ),
        { statusCode: 400 },
      );
    }

    // Check allowance for the timelock contract
    const allowance = await ethersHelper.readContract<bigint>(
      vault.atvTokenAddress,
      ["function allowance(address owner, address spender) view returns (uint256)"],
      "allowance",
      [userAddress, timelockAddress],
      vault.chain,
    );

    const steps: TxStep[] = [];

    if (allowance < amountBigInt) {
      const approveCalldata = ethersHelper.encodeContractCall(
        vault.atvTokenAddress,
        erc20Abi as string[],
        "approve",
        [timelockAddress, amountBigInt],
      );
      steps.push({
        step: 1,
        label: `Approve ${vaultId} tokens for staking`,
        type: TxStepType.Approve,
        ...approveCalldata,
        value: "0",
        from: userAddress,
        chainId,
      });
    }

    const stakeCalldata = ethersHelper.encodeContractCall(
      timelockAddress,
      vault.contracts.timelock.abi,
      "stake",
      [amountBigInt, lockPeriodIndex],
    );
    steps.push({
      step: steps.length + 1,
      label: `Stake ${vaultId} tokens`,
      type: TxStepType.Stake,
      ...stakeCalldata,
      value: "0",
      from: userAddress,
      chainId,
    });

    return steps;
  }

  /**
   * Build an unstake transaction step for a timelock vault.
   *   unstake(stakeIndex, amount)
   */
  async buildUnstakeTx(
    userAddress: string,
    vaultAddress: string,
    stakeIndex: number,
    unstakeAmount: string,
  ): Promise<TxStep[]> {
    const vault = await vaultRegistry.getVaultOrThrow(vaultAddress);
    const vaultId = formatVaultID(vault.productId);

    if (vault.timelockContractType === "NONE" || !vault.contracts.timelock) {
      throw Object.assign(
        new Error(`Vault ${vaultId} does not support staking`),
        { statusCode: 400 },
      );
    }

    const decimals = await ethersHelper.readContract<bigint>(
      vault.atvTokenAddress,
      ["function decimals() view returns (uint8)"],
      "decimals",
      [],
      vault.chain,
    );
    const amountBigInt = ethers.parseUnits(unstakeAmount, Number(decimals));

    const unstakeCalldata = ethersHelper.encodeContractCall(
      vault.contracts.timelock.address,
      vault.contracts.timelock.abi,
      "unstake",
      [stakeIndex, amountBigInt],
    );

    return [
      {
        step: 1,
        label: `Unstake ${vaultId} tokens`,
        type: TxStepType.Unstake,
        ...unstakeCalldata,
        value: "0",
        from: userAddress,
        chainId: vault.chain.decimal,
      },
    ];
  }
}

export const stakeService = new StakeService();
