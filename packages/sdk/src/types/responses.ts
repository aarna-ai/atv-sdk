export interface VaultMetadata {
    productId: string;
    label: string;
    address: string;
    chain: string;
}

export interface NavResponse {
    address: string;
    /** NAV as a string (bigint serialized by the API). Use BigInt(nav) for math. */
    nav: string;
    /** Decimal places: 18 for leverage vaults, 4 for standard vaults */
    decimals: number;
}

export interface TvlResponse {
    address: string;
    /** TVL in USD, 18 decimals, serialized as string */
    tvl: string;
}

export interface ApyResponse {
    address: string;
    /** APY as a percentage string, e.g. "12.45" means 12.45% */
    apy: string;
}

/** Single transaction calldata — pass directly to your wallet's sendTransaction */
export interface TxCalldata {
    to: string;
    data: string;
    value: string;
    from: string;
}

export interface ApiResponse<T> {
    data: T;
    message: string;
    statusCode: number;
}
