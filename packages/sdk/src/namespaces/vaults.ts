import { AxiosInstance } from 'axios';
import { ListVaultsParams } from '../types/requests';
import {
    ApiResponse,
    ApyResponse,
    NavResponse,
    TvlResponse,
    VaultMetadata,
} from '../types/responses';

export class VaultsNamespace {
    constructor(private readonly http: AxiosInstance) {}

    /**
     * List all available vaults.
     * @param params.chain — optional chain filter ("ethereum", "base")
     */
    async list(params?: ListVaultsParams): Promise<VaultMetadata[]> {
        const { data } = await this.http.get<ApiResponse<VaultMetadata[]>>(
            '/v1/vaults',
            { params },
        );
        return data.data;
    }

    /**
     * Get the current NAV (Net Asset Value) for a vault.
     * @param address — vault atvTokenAddress
     */
    async nav(address: string): Promise<NavResponse> {
        const { data } = await this.http.get<ApiResponse<NavResponse>>(
            `/v1/vaults/${address}/nav`,
        );
        return data.data;
    }

    /**
     * Get the current TVL (Total Value Locked) for a vault.
     * @param address — vault atvTokenAddress
     */
    async tvl(address: string): Promise<TvlResponse> {
        const { data } = await this.http.get<ApiResponse<TvlResponse>>(
            `/v1/vaults/${address}/tvl`,
        );
        return data.data;
    }

    /**
     * Get the current APY for a vault.
     * @param address — vault atvTokenAddress
     */
    async apy(address: string): Promise<ApyResponse> {
        const { data } = await this.http.get<ApiResponse<ApyResponse>>(
            `/v1/vaults/${address}/apy`,
        );
        return data.data;
    }
}
