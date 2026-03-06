import axios, { AxiosInstance } from 'axios';
import { VaultsNamespace } from './namespaces/vaults';
import { TransactionsNamespace } from './namespaces/transactions';

export interface AtvClientOptions {
    apiKey: string;
    /** Base URL of the hosted API. Defaults to https://api.atv.finance */
    baseURL?: string;
    /** Request timeout in milliseconds. Defaults to 10000. */
    timeout?: number;
}

export class AtvClient {
    public readonly vaults: VaultsNamespace;
    public readonly transactions: TransactionsNamespace;

    private readonly http: AxiosInstance;

    constructor(options: AtvClientOptions) {
        this.http = axios.create({
            baseURL: options.baseURL ?? 'https://api.atv.finance',
            timeout: options.timeout ?? 10_000,
            headers: {
                'x-api-key': options.apiKey,
                'Content-Type': 'application/json',
            },
        });

        // Global response interceptor — surfaces API errors as typed exceptions
        this.http.interceptors.response.use(
            (response) => response,
            (error) => {
                const message =
                    error.response?.data?.error ?? error.message ?? 'Unknown error';
                const statusCode = error.response?.status ?? 0;
                const apiError = Object.assign(new Error(message), { statusCode });
                return Promise.reject(apiError);
            },
        );

        this.vaults = new VaultsNamespace(this.http);
        this.transactions = new TransactionsNamespace(this.http);
    }
}
