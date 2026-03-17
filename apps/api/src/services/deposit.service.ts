import { ethers } from "ethers";
import { EvmChain } from "@moralisweb3/common-evm-utils";
import { vaultRegistry } from "../config/vault-registry";
import erc20Abi from "../config/abis/erc20.abi.json";
import { ethersHelper } from "../helpers/ethers.helper";
import { TxStep, TxStepType } from "../types/api.types";
import {
  DepositContractType,
  IAtvVault,
  ProductId,
} from "../types/vault.types";
import { formatVaultID } from "../utils/format";

export class DepositService {
  /**
   * Build deposit transaction steps with full pre-flight validation.
   *
   * Guardrails (checked before encoding any calldata):
   *   1. Deposits are not paused on the vault contract
   *   2. User has sufficient token balance for the deposit amount
   *   3. Amount >= minDeposit() (best-effort — skipped if function absent)
   *   4. Amount <= maxDeposit(user) (best-effort — skipped if function absent)
   *   5. Allowance is checked — the `approve` step is only included if the
   *      current allowance is insufficient (saves gas for repeat depositors)
   *
   * Response is 1–2 steps:
   *   step N   (type: "approve")  — only present when allowance < amount
   *   step N+1 (type: "deposit")  — always present
   *
   * Deposit target and function signature vary by vault type:
   *   ERC4626 (non-atvPTmax) → timelock contract, deposit(uint256, address)
   *   ERC20 / atvPTmax       → atvToken address,  deposit(uint256, address)
   */
  async buildDepositTx(
    userAddress: string,
    vaultAddress: string,
    depositTokenAddress: string,
    depositAmount: string,
  ): Promise<TxStep[]> {
    const vault = await vaultRegistry.getVaultOrThrow(vaultAddress);

    const chainId = vault.chain.decimal;
    const vaultId = formatVaultID(vault.productId);

    // Fetch token metadata in parallel
    const [tokenSymbol, tokenDecimals] = await Promise.all([
      ethersHelper.readContract<string>(
        depositTokenAddress,
        ["function symbol() view returns (string)"],
        "symbol",
        [],
        vault.chain,
      ),
      ethersHelper.readContract<bigint>(
        depositTokenAddress,
        ["function decimals() view returns (uint8)"],
        "decimals",
        [],
        vault.chain,
      ),
    ]);

    // Convert human-readable amount (e.g. "100") to wei using token decimals
    const amountBigInt = ethers.parseUnits(
      depositAmount,
      Number(tokenDecimals),
    );

    // --- Guardrail 1: deposits paused ---
    // Best-effort — not all vault contracts expose depositPaused().
    // If the function is absent the call will throw; we catch and skip.
    try {
      const isPaused = await ethersHelper.readContract<boolean>(
        vault.contracts.base.address,
        ["function depositPaused() view returns (bool)"],
        "depositPaused",
        [],
        vault.chain,
      );
      if (isPaused) {
        const err = Object.assign(
          new Error("Deposits are currently paused for this vault"),
          { statusCode: 400 },
        );
        throw err;
      }
    } catch (e: any) {
      if (e.statusCode) throw e; // re-throw our own 400
      // Contract doesn't expose depositPaused() — skip this check
    }

    // --- Guardrail 2: user balance ---
    const userBalance = await ethersHelper.readContract<bigint>(
      depositTokenAddress,
      ["function balanceOf(address owner) view returns (uint256)"],
      "balanceOf",
      [userAddress],
      vault.chain,
    );

    if (userBalance < amountBigInt) {
      const have = ethers.formatUnits(userBalance, Number(tokenDecimals));
      const want = ethers.formatUnits(amountBigInt, Number(tokenDecimals));
      const err = Object.assign(
        new Error(
          `Insufficient ${tokenSymbol} balance: wallet has ${have} ${tokenSymbol} but deposit requires ${want} ${tokenSymbol}`,
        ),
        { statusCode: 400 },
      );
      throw err;
    }

    // Determine the contract that receives the deposit and requires approval
    const isErc4626Timelock =
      vault.depositContractType === DepositContractType.ERC4626 &&
      vault.productId !== ProductId.atvPTmax;

    const depositTarget = isErc4626Timelock
      ? vault.contracts.timelock!.address
      : vault.atvTokenAddress;

    // --- Guardrail 3: min deposit ---
    // Only called if the vault ABI exposes minimumDepositLimit().
    // On Base the function takes the input token address; on other chains no args.
    // minDepositLimit is a human-readable integer from the contract (e.g. 100 = 100 USDC).
    // Scale it to wei to compare against amountBigInt.
    const minDepositLimit = await this.getMinDepositLimit(
      vault,
      depositTokenAddress,
    );
    if (minDepositLimit > 0n) {
      const minDepositLimitWei = ethers.parseUnits(
        minDepositLimit.toString(),
        Number(tokenDecimals),
      );
      if (amountBigInt < minDepositLimitWei) {
        const err = Object.assign(
          new Error(
            `Deposit amount is below the minimum: ${minDepositLimit.toString()} ${tokenSymbol} required`,
          ),
          { statusCode: 400 },
        );
        throw err;
      }
    }

    // --- Guardrail 5: check existing allowance ---
    const userAllowance = await ethersHelper.readContract<bigint>(
      depositTokenAddress,
      [
        "function allowance(address owner, address spender) view returns (uint256)",
      ],
      "allowance",
      [userAddress, depositTarget],
      vault.chain,
    );

    const steps: TxStep[] = [];

    // Only include approve if allowance is insufficient
    if (userAllowance < amountBigInt) {
      const approveCalldata = ethersHelper.encodeContractCall(
        depositTokenAddress,
        erc20Abi as string[],
        "approve",
        [depositTarget, amountBigInt],
      );
      steps.push({
        step: 1,
        label: `Approve ${tokenSymbol} for ${vaultId} deposit`,
        type: TxStepType.Approve,
        ...approveCalldata,
        value: "0",
        from: userAddress,
        chainId,
      });
    }

    // Deposit calldata — args differ by contract type
    //   ERC4626 : deposit(uint256 assets, address receiver)
    //   ERC20   : deposit(uint256 amount, address depositToken)
    const depositArgs =
      vault.depositContractType === DepositContractType.ERC4626
        ? [amountBigInt, userAddress]
        : [amountBigInt, depositTokenAddress];

    const depositCalldata = ethersHelper.encodeContractCall(
      depositTarget,
      vault.contracts.base.abi,
      "deposit",
      depositArgs,
    );

    steps.push({
      step: steps.length + 1,
      label: `Deposit ${tokenSymbol} into ${vaultId}`,
      type: TxStepType.Deposit,
      ...depositCalldata,
      value: "0",
      from: userAddress,
      chainId,
    });

    return steps;
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

      // Base chain passes the input token address; other chains take no args
      const args =
        vault.chain.apiHex === EvmChain.BASE.apiHex ? [inputTokenAddress] : [];

      const minDepositLimit = await ethersHelper.readContract<bigint>(
        vault.atvTokenAddress,
        vaultAbi,
        "minimumDepositLimit",
        args,
        vault.chain,
      );

      return BigInt(minDepositLimit.toString());
    } catch {
      return 0n;
    }
  }
}

export const depositService = new DepositService();
