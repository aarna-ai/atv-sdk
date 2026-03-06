export interface ListVaultsParams {
    /** Filter by chain name, e.g. "ethereum", "base" */
    chain?: string;
}

export interface DepositTxParams {
    userAddress: string;
    vaultAddress: string;
    depositTokenAddress: string;
    /** Amount in wei, as a string to avoid BigInt serialization issues */
    depositAmount: string;
}

export interface WithdrawTxParams {
    userAddress: string;
    vaultAddress: string;
    /** Output token address to receive on withdrawal */
    oTokenAddress: string;
    /** Number of vault shares to redeem, in wei as a string */
    sharesToWithdraw: string;
    /** Slippage tolerance as a percentage, e.g. 0.5 = 0.5%. Defaults to 0. */
    slippage?: number;
    /** If true, the API will simulate the transaction before returning calldata */
    simulate?: boolean;
}

export interface FluxWithdrawTxParams {
    userAddress: string;
    vaultAddress: string;
    /** Number of vault shares to queue for withdrawal, in wei as a string */
    sharesToWithdraw: string;
    /** Slippage tolerance as a percentage. Defaults to 0. */
    slippage?: number;
}
