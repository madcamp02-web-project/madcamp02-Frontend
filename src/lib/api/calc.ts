import { api } from './index';

export interface DividendCalculationRequest {
    tickers?: string[]; // 특정 종목만 계산하려면 제공 (없으면 전체 포트폴리오)
}

export interface TaxCalculationRequest {
    realizedGain: number; // 실현 수익
}

export interface DividendCalculationResponse {
    totalDividend: number;
    withholdingTax: number;
    netDividend: number;
    items: Array<{
        ticker: string;
        dividend: number;
        withholdingTax: number;
        netDividend: number;
    }>;
}

export interface TaxCalculationResponse {
    taxAmount: number;
    netAmount: number;
    taxRate: number;
}

export const calcApi = {
    // 배당금 계산
    getDividend: async (params?: DividendCalculationRequest): Promise<DividendCalculationResponse> => {
        const { data } = await api.get<DividendCalculationResponse>('/api/v1/calc/dividend', {
            params: params?.tickers ? { tickers: params.tickers.join(',') } : {}
        });
        return data;
    },

    // 양도소득세 계산
    getTax: async (params: TaxCalculationRequest): Promise<TaxCalculationResponse> => {
        const { data } = await api.post<TaxCalculationResponse>('/api/v1/calc/tax', params);
        return data;
    },
};
