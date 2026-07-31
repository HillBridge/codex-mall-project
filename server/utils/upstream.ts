import { createHash, createHmac } from 'node:crypto'
import { appendResponseHeader, getCookie, getHeader, getRequestURL, splitCookiesString } from 'h3'
import type { H3Event } from 'h3'
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, SESSION_COOKIE_NAME } from '~~/shared/constants/auth'
import {
  SERVICE_ID_HEADER,
  SERVICE_SIGNATURE_HEADER,
  SERVICE_TIMESTAMP_HEADER,
  SERVICE_TOKEN_HEADER
} from '~~/shared/constants/service-auth'
import type { ApiErrorCode, ApiFailure } from '~~/shared/types/api'
import { getTraceId, throwApiError } from './api-response'
import { logger } from './logger'
import { getUpstreamMaxAttempts, type UpstreamHttpMethod } from './upstream-retry-policy'

type UpstreamOptions = {
  method?: UpstreamHttpMethod
  body?: unknown
  query?: Record<string, unknown>
  headers?: HeadersInit
  timeout?: number
}

type ServiceAuthConfig = {
  serviceId: string
  serviceToken: string
  signatureSecret: string
}

const DEFAULT_SERVICE_TOKEN = 'nuxt-pilot-local-service-token'
const DEFAULT_SERVICE_SIGNATURE_SECRET = 'nuxt-pilot-local-service-signature-secret'

export function createUpstreamClient(event: H3Event) {
  const config = useRuntimeConfig(event)
  const baseURL = config.apiBaseInternal
  const serviceAuth = createServiceAuthConfig(event, config)

  return async function upstreamFetch<T>(path: string, options: UpstreamOptions = {}): Promise<T> {
    if (!baseURL) {
      throwApiError(event, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: '未配置上游服务地址'
      })
    }

    try {
      const response = await fetchUpstream(event, baseURL, path, options, serviceAuth)

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
  options: UpstreamOptions,
  serviceAuth: ServiceAuthConfig
) {
  const timeout = options.timeout || 15000
  const method = options.method || 'GET'
  const maxAttempts = getUpstreamMaxAttempts(method)
  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const requestURL = createUpstreamURL(baseURL, path, options.query)
      const requestBody = createUpstreamBody(options.body)
      const startedAt = Date.now()

      const response = await fetch(requestURL, {
        method,
        headers: createUpstreamHeaders(
          event,
          options.headers,
          method,
          requestURL,
          requestBody,
          serviceAuth
        ),
        body: requestBody,
        signal: controller.signal
      })

      logger[response.ok ? 'info' : 'warn']('bff.upstream', {
        traceId: getTraceId(event),
        method,
        path: createSignedPath(requestURL),
        statusCode: response.status,
        durationMs: Date.now() - startedAt,
        attempt: attempt + 1
      })

      return response
    } catch (error) {
      lastError = error
      if (attempt + 1 >= maxAttempts) break

      logger.warn('bff.upstream', {
        traceId: getTraceId(event),
        method,
        path,
        durationMs: timeout,
        attempt: attempt + 1,
        errorCode: 'UPSTREAM_RETRY'
      })
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
      value.forEach((item) => url.searchParams.append(key, String(item)))
      return
    }

    url.searchParams.set(key, String(value))
  })

  return url
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`
}

function createUpstreamHeaders(
  event: H3Event,
  input: HeadersInit | undefined,
  method: UpstreamHttpMethod,
  upstreamURL: URL,
  body: string | undefined,
  serviceAuth: ServiceAuthConfig
) {
  const headers = new Headers(input)
  const requestURL = getRequestURL(event)

  headers.delete('cookie')
  headers.set('x-request-id', getTraceId(event))
  headers.set('x-forwarded-host', getHeader(event, 'host') || requestURL.host)
  headers.set(
    'x-forwarded-proto',
    getHeader(event, 'x-forwarded-proto') || requestURL.protocol.replace(':', '')
  )
  copyHeader(event, headers, CSRF_HEADER_NAME)

  if (body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const cookie = createWhitelistedCookieHeader(event)
  if (cookie) {
    headers.set('cookie', cookie)
  }

  setServiceAuthHeaders(headers, method, upstreamURL, body, serviceAuth)

  return headers
}

function setServiceAuthHeaders(
  headers: Headers,
  method: UpstreamHttpMethod,
  upstreamURL: URL,
  body: string | undefined,
  serviceAuth: ServiceAuthConfig
) {
  const timestamp = String(Math.floor(Date.now() / 1000))

  headers.set(SERVICE_ID_HEADER, serviceAuth.serviceId)
  headers.set(SERVICE_TOKEN_HEADER, serviceAuth.serviceToken)
  headers.set(SERVICE_TIMESTAMP_HEADER, timestamp)
  headers.set(
    SERVICE_SIGNATURE_HEADER,
    createServiceSignature({
      secret: serviceAuth.signatureSecret,
      serviceId: serviceAuth.serviceId,
      timestamp,
      method,
      path: createSignedPath(upstreamURL),
      body: body || ''
    })
  )
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

function createUpstreamBody(body: unknown): string | undefined {
  if (body === undefined) return undefined
  return JSON.stringify(body)
}

function createServiceAuthConfig(
  event: H3Event,
  config: ReturnType<typeof useRuntimeConfig>
): ServiceAuthConfig {
  const serviceId = config.upstreamServiceId || process.env.BFF_SERVICE_ID || 'nuxt-bff'
  const serviceToken =
    config.upstreamServiceToken ||
    process.env.BFF_SERVICE_TOKEN ||
    getLocalDefault(DEFAULT_SERVICE_TOKEN)
  const signatureSecret =
    config.upstreamServiceSignatureSecret ||
    process.env.BFF_SERVICE_SIGNATURE_SECRET ||
    getLocalDefault(DEFAULT_SERVICE_SIGNATURE_SECRET)

  if (!serviceToken || !signatureSecret) {
    throwApiError(event, {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: '未配置上游服务认证信息'
    })
  }

  return {
    serviceId,
    serviceToken,
    signatureSecret
  }
}

function createServiceSignature({
  secret,
  serviceId,
  timestamp,
  method,
  path,
  body
}: {
  secret: string
  serviceId: string
  timestamp: string
  method: UpstreamHttpMethod
  path: string
  body: string
}) {
  const payload = [method.toUpperCase(), path, hashBody(body), timestamp, serviceId].join('\n')

  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function createSignedPath(url: URL) {
  return `${url.pathname}${url.search}`
}

function hashBody(body: string) {
  return createHash('sha256').update(body).digest('base64url')
}

function getLocalDefault(value: string) {
  return process.env.NODE_ENV === 'production' ? '' : value
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
    ? directSetCookieHeaders.flatMap((cookie) => splitCookiesString(cookie))
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
