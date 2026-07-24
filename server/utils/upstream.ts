import type { H3Event } from 'h3'
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

  const client = $fetch.create({
    baseURL,
    retry: 1,
    timeout: 15000,
    headers: {
      'x-request-id': getTraceId(event)
    },
    onResponseError({ response }) {
      throwApiError(event, {
        statusCode: response.status,
        code: 'UPSTREAM_ERROR',
        message: '上游服务请求失败',
        details: response._data
      })
    }
  }) as unknown as <T>(request: string, opts?: UpstreamOptions) => Promise<T>

  return async function upstreamFetch<T>(path: string, options: UpstreamOptions = {}): Promise<T> {
    if (!baseURL) {
      throwApiError(event, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: '未配置上游服务地址'
      })
    }

    return await client<T>(path, options)
  }
}
