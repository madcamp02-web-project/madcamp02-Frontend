// 공통 API 에러 파싱 유틸
// - AxiosError, FetchError, 일반 Error 등을 일관된 형태로 변환한다.

export interface ParsedError {
    status?: number;
    code?: string;
    message: string;
    // 백엔드에서 필드별 에러를 내려줄 수 있으므로, 선택적으로 포함한다.
    fieldErrors?: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseError(error: any): ParsedError {
    // Axios 에러 형태 우선 처리
    const response = error?.response;
    const data = response?.data;

    const status: number | undefined = response?.status;
    const code: string | undefined = data?.error || data?.code;
    const message: string =
        data?.message ||
        data?.error_description ||
        error?.message ||
        '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

    const fieldErrors: Record<string, string> | undefined = data?.fieldErrors || data?.errors;

    return {
        status,
        code,
        message,
        fieldErrors,
    };
}

