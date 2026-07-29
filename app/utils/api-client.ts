import { $fetch } from 'ofetch'
import { readCsrfCookie } from '~/utils/auth-cookie'
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '~~/shared/constants/auth'
import type {
  ApiClientError,
  ApiErrorCode,
  ApiFailure,
  ApiResponseFor,
  ApiSuccess
} from '~~/shared/types/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

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
  fetcher?: ApiClientFetcher
}

export type ApiClientFetcher = <T>(
  request: string,
  opts?: ApiClientOptions & {
    baseURL?: string
    retry?: number
    credentials?: RequestCredentials
  }
) => Promise<T>

type BaseApiFetch = <T>(
  request: string,
  opts?: ApiClientOptions & {
    credentials?: RequestCredentials
  }
) => Promise<T>

const baseFetchCache = new Map<string, BaseApiFetch>()

export function createApiClient(options: CreateApiClientOptions): ApiClient {
  const client = getBaseApiFetch(options.baseURL, options.fetcher)

  return async function apiClient<TPath extends string>(
    path: TPath,
    requestOptions: ApiClientOptions = {}
  ): Promise<ApiResponseFor<TPath>> {
    const headers = createRequestHeaders(
      requestOptions.headers,
      options.forwardedHeaders,
      requestOptions.method
    )
    const response = await client<ApiSuccess<ApiResponseFor<TPath>>>(normalizeApiPath(path), {
      ...requestOptions,
      credentials: 'include',
      headers
    })

    return response.data
  }
}

function getBaseApiFetch(baseURL: string, fetcher?: ApiClientFetcher) {
  if (fetcher) {
    return createBaseApiFetch(baseURL, fetcher)
  }

  const cachedClient = baseFetchCache.get(baseURL)

  if (cachedClient) {
    return cachedClient
  }

  const client = createBaseApiFetch(baseURL, $fetch as ApiClientFetcher)

  baseFetchCache.set(baseURL, client)

  return client
}

function createBaseApiFetch(baseURL: string, fetcher: ApiClientFetcher): BaseApiFetch {
  return async function baseApiFetch<T>(request: string, opts: ApiClientOptions = {}) {
    try {
      return await fetcher<T>(request, {
        ...opts,
        baseURL,
        retry: 0,
        timeout: opts.timeout || 15000
      })
    } catch (error) {
      throw normalizeFetchError(error)
    }
  }
}

function createRequestHeaders(
  requestHeaders?: HeadersInit,
  forwardedHeaders?: Record<string, string | undefined>,
  method: HttpMethod = 'GET'
) {
  const headers = new Headers(requestHeaders)

  headers.set('x-requested-with', 'NuxtPilotClient')

  Object.entries(forwardedHeaders || {}).forEach(([key, value]) => {
    if (value) headers.set(key, value)
  })

  if (isUnsafeMethod(method) && !headers.has(CSRF_HEADER_NAME)) {
    const csrfToken = readCsrfToken(headers.get('cookie') || '')
    if (csrfToken) headers.set(CSRF_HEADER_NAME, csrfToken)
  }

  return headers
}

function isUnsafeMethod(method: HttpMethod) {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'
}

function readCsrfToken(cookieHeader: string) {
  if (import.meta.client) return readCsrfCookie()
  return readCookieValue(cookieHeader, CSRF_COOKIE_NAME)
}

function readCookieValue(cookieHeader: string, name: string) {
  return (
    cookieHeader
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.split('=')
      .slice(1)
      .join('=') || ''
  )
}

function normalizeApiPath(path: string) {
  return path.replace(/^\/api(?=\/|$)/, '').replace(/^\/+/, '')
}

function normalizeApiError(
  statusCode: number,
  payload?: { message?: string; statusMessage?: string; data?: ApiFailure } | ApiFailure
) {
  const body = readApiFailure(payload)
  const error = new Error(
    body?.message || readPayloadMessage(payload) || '请求失败'
  ) as ApiClientError

  error.statusCode = statusCode
  error.code = body?.code || statusToCode(statusCode)
  error.traceId = body?.traceId
  error.details = body?.details

  return error
}

function normalizeFetchError(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (
      error as {
        response?: {
          status: number
          _data?: { message?: string; statusMessage?: string; data?: ApiFailure } | ApiFailure
        }
      }
    ).response
    if (response) {
      return normalizeApiError(response.status, response._data)
    }
  }

  if (
    error &&
    typeof error === 'object' &&
    ('data' in error || 'statusCode' in error || 'status' in error)
  ) {
    const fetchError = error as {
      statusCode?: number
      status?: number
      data?: { message?: string; statusMessage?: string; data?: ApiFailure } | ApiFailure
      message?: string
      statusMessage?: string
    }
    return normalizeApiError(
      fetchError.statusCode || fetchError.status || 500,
      fetchError.data || {
        message: fetchError.message,
        statusMessage: fetchError.statusMessage
      }
    )
  }

  return error
}

function readApiFailure(payload?: { data?: ApiFailure } | ApiFailure) {
  if (!payload) return undefined
  if ('code' in payload) return payload
  return payload.data
}

function readPayloadMessage(payload?: { message?: string; statusMessage?: string } | ApiFailure) {
  if (!payload) return ''
  if ('statusMessage' in payload && payload.statusMessage) return payload.statusMessage
  return payload.message || ''
}

function statusToCode(statusCode: number): ApiErrorCode {
  if (statusCode === 400) return 'BAD_REQUEST'
  if (statusCode === 401) return 'UNAUTHORIZED'
  if (statusCode === 403) return 'FORBIDDEN'
  if (statusCode === 404) return 'NOT_FOUND'
  if (statusCode === 422) return 'VALIDATION_ERROR'
  return 'INTERNAL_ERROR'
}
