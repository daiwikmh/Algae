import { AlgopayClient } from "../client";
import { CreateGasPoolParams, GasPool, GasPoolBalance, TopUpGasPoolParams, UpdateGasPoolParams } from "../types";
import { sanitizeId, sanitizeString, sanitizePositiveInt } from "../lib/sanitize";

export class GasPoolModule {
    constructor(private readonly client: AlgopayClient) { }

    create(params: CreateGasPoolParams): Promise<GasPool> {
        sanitizeId(params.apiKeyId, 'apiKeyId')
        sanitizePositiveInt(params.dailyCapCents, 'dailyCapCents')
        sanitizeString(params.alertThresholdUsdc, 'alertThresholdUsdc')
        return this.client.post<GasPool>('/gas-pool', params)
    }

    getBalance(apiKeyId: string): Promise<GasPoolBalance> {
        return this.client.get<GasPoolBalance>(
            `/gas-pool/${sanitizeId(apiKeyId, 'apiKeyId')}/balance`
        )
    }

    topUp(apiKeyId: string, params: TopUpGasPoolParams): Promise<GasPool> {
        sanitizeId(apiKeyId, 'apiKeyId')
        sanitizeString(params.amountUsdc, 'amountUsdc')
        sanitizeString(params.txnId, 'txnId')
        return this.client.post<GasPool>(
            `/gas-pool/${sanitizeId(apiKeyId, 'apiKeyId')}/topup`,
            params
        )
    }

    updateSettings(
        apiKeyId: string,
        params: UpdateGasPoolParams
    ): Promise<GasPool> {
        sanitizeId(apiKeyId, 'apiKeyId')
        if (params.dailyCapCents !== undefined) {
            sanitizePositiveInt(params.dailyCapCents, 'dailyCapCents')
        }
        if (params.alertThresholdUsdc !== undefined) {
            sanitizeString(params.alertThresholdUsdc, 'alertThresholdUsdc')
        }
        return this.client.patch<GasPool>(
            `/gas-pool/${sanitizeId(apiKeyId, 'apiKeyId')}/settings`,
            params
        )
    }
}