import { api } from "./index";

// Calc API 스펙 기반 타입 정의
// - GET /api/v1/calc/dividend
// - GET /api/v1/calc/tax
// - 모든 계산은 1차 버전에서 USD 기준, currency는 null

export interface CalcDividendResponse {
    totalDividend: number;
    withholdingTax: number;
    netDividend: number;
    currency: string | null;
}

export interface CalcTaxResponse {
    realizedProfit: number;
    taxBase: number;
    estimatedTax: number;
    currency: string | null;
}

export interface GetDividendParams {
    // 배당 수익률 (0.03 = 3%)
    assumedDividendYield?: number;
    // 주당 배당액 (현재 버전에서는 서버 계산에 사용되지 않지만, 시그니처는 확보)
    dividendPerShare?: number;
    // 배당소득세 세율 (0.154 = 15.4%)
    taxRate?: number;
}

export interface GetTaxParams {
    // 양도소득세 세율 (0.22 = 22%)
    taxRate?: number;
}

export const calcApi = {
    // 배당금/세후 배당 계산
    async getDividend(params: GetDividendParams): Promise<CalcDividendResponse> {
        const { data } = await api.get<CalcDividendResponse>("/api/v1/calc/dividend", {
            params,
        });
        return data;
    },

    // 양도소득세 계산
    async getTax(params: GetTaxParams): Promise<CalcTaxResponse> {
        const { data } = await api.get<CalcTaxResponse>("/api/v1/calc/tax", {
            params,
        });
        return data;
    },
};
