import type { ApiClientError, ApiErrorCode, ApiFailure, ApiResponseFor, ApiSuccess } from '~~/shared/types/api'

type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'

export type ApiClientOptions = {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, unknown>
  headers?: HeadersInit
  signal?: AbortSignal
  timeout?: number
}

export type ApiClient = <TPath extends string>(
  path: TPath,
  options?: ApiClientOptions
) => Promise<ApiResponseFor<TPath>>

type CreateApiClientOptions = {
  baseURL: string
  forwardedHeaders?: Record<string, string | undefined>
}

export function createApiClient(options: CreateApiClientOptions): ApiClient {
  const client = $fetch.create({
    baseURL: options.baseURL,
    retry: 0,
    timeout: 15000,
    onRequest({ options: requestOptions }) {
      requestOptions.credentials = 'include'
      const headers = new Headers(requestOptions.headers as HeadersInit)

      headers.set('x-requested-with', 'NuxtPilotClient')

      Object.entries(options.forwardedHeaders || {}).forEach(([key, value]) => {
        if (value) headers.set(key, value)
      })

      requestOptions.headers = headers
    },
    onResponseError({ response }) {
      throw normalizeApiError(response.status, response._data)
    }
  }) as unknown as <T>(request: string, opts?: ApiClientOptions) => Promise<T>

  return async function apiClient<TPath extends string>(
    path: TPath,
    requestOptions: ApiClientOptions = {}
  ): Promise<ApiResponseFor<TPath>> {
    const response = await client<ApiSuccess<ApiResponseFor<TPath>>>(
      normalizeApiPath(path),
      requestOptions
    )

    return response.data
  }
}

function normalizeApiPath(path: string) {
  return path
    .replace(/^\/api(?=\/|$)/, '')
    .replace(/^\/+/, '')
}

function normalizeApiError(statusCode: number, payload?: { message?: string, statusMessage?: string, data?: ApiFailure }) {
  const body = payload?.data
  const error = new Error(body?.message || payload?.message || payload?.statusMessage || '请求失败') as ApiClientError

  error.statusCode = statusCode
  error.code = body?.code || statusToCode(statusCode)
  error.traceId = body?.traceId
  error.details = body?.details

  return error
}

function statusToCode(statusCode: number): ApiErrorCode {
  if (statusCode === 400) return 'BAD_REQUEST'
  if (statusCode === 401) return 'UNAUTHORIZED'
  if (statusCode === 403) return 'FORBIDDEN'
  if (statusCode === 404) return 'NOT_FOUND'
  if (statusCode === 422) return 'VALIDATION_ERROR'
  return 'INTERNAL_ERROR'
}
