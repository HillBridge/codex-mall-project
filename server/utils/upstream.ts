import { appendResponseHeader, getCookie, getHeader, getRequestURL, splitCookiesString } from 'h3'
import type { H3Event } from 'h3'
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, SESSION_COOKIE_NAME } from '~~/shared/constants/auth'
import type { ApiErrorCode, ApiFailure } from '~~/shared/types/api'
import { getTraceId, throwApiError } from './api-response'

type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'

type UpstreamOptions = {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, unknown>
  headers?: HeadersInit
  timeout?: number
}

export function createUpstreamClient(event: H3Event) {
  const config = useRuntimeConfig(event)
  const baseURL = config.apiBaseInternal

  return async function upstreamFetch<T>(path: string, options: UpstreamOptions = {}): Promise<T> {
    if (!baseURL) {
      throwApiError(event, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: '未配置上游服务地址'
      })
    }

    try {
      const response = await fetchUpstream(event, baseURL, path, options)

      forwardSetCookieHeaders(event, response.headers)

      const data = await readJsonBody<T>(response)

      if (!response.ok) {
        const failure = data as Partial<ApiFailure>
        throwApiError(event, {
          statusCode: response.status,
          code: normalizeUpstreamCode(failure?.code),
          message: failure?.message || '上游服务请求失败',
          details: failure?.details
        })
      }

      return data
    } catch (error) {
      if (isH3Error(error)) throw error

      throwApiError(event, {
        statusCode: 502,
        code: 'UPSTREAM_ERROR',
        message: '上游服务不可用',
        details: error
      })
    }
  }
}

async function fetchUpstream(
  event: H3Event,
  baseURL: string,
  path: string,
  options: UpstreamOptions
) {
  const timeout = options.timeout || 15000
  let lastError: unknown

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      return await fetch(createUpstreamURL(baseURL, path, options.query), {
        method: options.method || 'GET',
        headers: createUpstreamHeaders(event, options.headers, options.body),
        body: createUpstreamBody(options.body),
        signal: controller.signal
      })
    } catch (error) {
      lastError = error
      if (attempt > 0) break
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError
}

function createUpstreamURL(baseURL: string, path: string, query?: Record<string, unknown>) {
  const url = new URL(path.replace(/^\/+/, ''), ensureTrailingSlash(baseURL))

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    if (Array.isArray(value)) {
      value.forEach(item => url.searchParams.append(key, String(item)))
      return
    }

    url.searchParams.set(key, String(value))
  })

  return url
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`
}

function createUpstreamHeaders(event: H3Event, input?: HeadersInit, body?: unknown) {
  const headers = new Headers(input)
  const requestURL = getRequestURL(event)

  headers.delete('cookie')
  headers.set('x-request-id', getTraceId(event))
  headers.set('x-forwarded-host', getHeader(event, 'host') || requestURL.host)
  headers.set('x-forwarded-proto', getHeader(event, 'x-forwarded-proto') || requestURL.protocol.replace(':', ''))
  copyHeader(event, headers, CSRF_HEADER_NAME)

  if (body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const cookie = createWhitelistedCookieHeader(event)
  if (cookie) {
    headers.set('cookie', cookie)
  }

  return headers
}

function copyHeader(event: H3Event, headers: Headers, name: string) {
  const value = getHeader(event, name)
  if (value) headers.set(name, value)
}

function createWhitelistedCookieHeader(event: H3Event) {
  return [SESSION_COOKIE_NAME, CSRF_COOKIE_NAME]
    .map((name) => {
      const value = getCookie(event, name)
      return value ? `${name}=${encodeURIComponent(value)}` : ''
    })
    .filter(Boolean)
    .join('; ')
}

function createUpstreamBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined
  return JSON.stringify(body)
}

async function readJsonBody<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

function forwardSetCookieHeaders(event: H3Event, headers: Headers) {
  const readableHeaders = headers as Headers & {
    getSetCookie?: () => string[]
  }
  const directSetCookieHeaders = readableHeaders.getSetCookie?.() || []
  const fallbackSetCookieHeader = headers.get('set-cookie')
  const setCookieHeaders = directSetCookieHeaders.length
    ? directSetCookieHeaders.flatMap(cookie => splitCookiesString(cookie))
    : fallbackSetCookieHeader
      ? splitCookiesString(fallbackSetCookieHeader)
      : []

  setCookieHeaders.forEach((cookie) => {
    appendResponseHeader(event, 'set-cookie', cookie)
  })
}

function normalizeUpstreamCode(code?: string): ApiErrorCode {
  if (
    code === 'BAD_REQUEST' ||
    code === 'UNAUTHORIZED' ||
    code === 'FORBIDDEN' ||
    code === 'NOT_FOUND' ||
    code === 'VALIDATION_ERROR' ||
    code === 'UPSTREAM_ERROR' ||
    code === 'INTERNAL_ERROR'
  ) {
    return code
  }

  return 'UPSTREAM_ERROR'
}

function isH3Error(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'statusCode' in error)
}
