import { AxiosInstance } from 'axios';
import {
    DepositTxParams,
    FluxWithdrawTxParams,
    WithdrawTxParams,
} from '../types/requests';
import { ApiResponse, TxCalldata } from '../types/responses';

export class TransactionsNamespace {
    constructor(private readonly http: AxiosInstance) {}

    /**
     * Build deposit transaction calldata.
     *
     * Returns an ordered array of transactions to send:
     *   [0] ERC20 approve (grants vault spending rights)
     *   [1] deposit (transfers tokens into the vault)
     *
     * Pass each tx to your wallet's sendTransaction in order.
     */
    async buildDeposit(params: DepositTxParams): Promise<TxCalldata[]> {
        const { data } = await this.http.get<ApiResponse<TxCalldata[]>>(
            '/v1/deposit-tx',
            { params },
        );
        return data.data;
    }

    /**
     * Build withdraw transaction calldata.
     *
     * Returns the withdraw transaction (typically a single tx).
     * slippage defaults to 0 if not provided.
     */
    async buildWithdraw(params: WithdrawTxParams): Promise<TxCalldata[]> {
        const { data } = await this.http.get<ApiResponse<TxCalldata[]>>(
            '/v1/withdraw-tx',
            { params },
        );
        return data.data;
    }

    /**
     * Build flux (queued) withdraw transaction calldata.
     *
     * Flux withdrawals queue shares for settlement in a future batch.
     * Only available for vaults with a timelock contract.
     */
    async buildFluxWithdraw(params: FluxWithdrawTxParams): Promise<TxCalldata[]> {
        const { data } = await this.http.get<ApiResponse<TxCalldata[]>>(
            '/v1/flux-withdraw-tx',
            { params },
        );
        return data.data;
    }
}
