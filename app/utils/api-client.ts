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

type BaseApiFetch = <T>(request: string, opts?: ApiClientOptions & {
  credentials?: RequestCredentials
}) => Promise<T>

const baseFetchCache = new Map<string, BaseApiFetch>()

export function createApiClient(options: CreateApiClientOptions): ApiClient {
  const client = getBaseApiFetch(options.baseURL)

  return async function apiClient<TPath extends string>(
    path: TPath,
    requestOptions: ApiClientOptions = {}
  ): Promise<ApiResponseFor<TPath>> {
    const headers = createRequestHeaders(requestOptions.headers, options.forwardedHeaders)
    const response = await client<ApiSuccess<ApiResponseFor<TPath>>>(
      normalizeApiPath(path),
      {
        ...requestOptions,
        credentials: 'include',
        headers
      }
    )

    return response.data
  }
}

function getBaseApiFetch(baseURL: string) {
  const cachedClient = baseFetchCache.get(baseURL)

  if (cachedClient) {
    return cachedClient
  }

  const client = $fetch.create({
    baseURL,
    retry: 0,
    timeout: 15000,
    onResponseError({ response }) {
      throw normalizeApiError(response.status, response._data)
    }
  }) as unknown as BaseApiFetch

  baseFetchCache.set(baseURL, client)

  return client
}

function createRequestHeaders(
  requestHeaders?: HeadersInit,
  forwardedHeaders?: Record<string, string | undefined>
) {
  const headers = new Headers(requestHeaders)

  headers.set('x-requested-with', 'NuxtPilotClient')

  Object.entries(forwardedHeaders || {}).forEach(([key, value]) => {
    if (value) headers.set(key, value)
  })

  return headers
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
