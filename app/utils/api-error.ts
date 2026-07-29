import type { ApiClientError, ApiErrorCode } from '~~/shared/types/api'

export type ApiErrorView = {
  title: string
  message: string
  traceId?: string
  statusCode?: number
  code?: ApiErrorCode
}

export function createApiErrorView(
  error: unknown,
  fallbackMessage = '请求失败，请稍后重试。'
): ApiErrorView {
  const apiError = normalizeApiError(error)

  if (!apiError) {
    return {
      title: '操作没有完成',
      message: fallbackMessage
    }
  }

  const base = {
    traceId: apiError.traceId,
    statusCode: apiError.statusCode,
    code: apiError.code
  }

  if (apiError.statusCode === 401 || apiError.code === 'UNAUTHORIZED') {
    return {
      ...base,
      title: '需要重新登录',
      message: '登录状态已失效，请重新登录后继续操作。'
    }
  }

  if (apiError.statusCode === 403 || apiError.code === 'FORBIDDEN') {
    return {
      ...base,
      title: '请求被拦截',
      message: '当前操作没有通过安全校验，请刷新页面后再试。'
    }
  }

  if (apiError.statusCode === 404 || apiError.code === 'NOT_FOUND') {
    return {
      ...base,
      title: '内容不存在',
      message: apiError.message || '你访问的内容不存在或已经下架。'
    }
  }

  if (apiError.statusCode === 422 || apiError.code === 'VALIDATION_ERROR') {
    return {
      ...base,
      title: '内容需要调整',
      message: apiError.message || '提交内容有误，请检查后再试。'
    }
  }

  if (apiError.statusCode === 502 || apiError.code === 'UPSTREAM_ERROR') {
    return {
      ...base,
      title: '服务暂时不可用',
      message: '后端服务暂时不可用，请稍后重试。'
    }
  }

  return {
    ...base,
    title: '页面暂时不可用',
    message: apiError.message || fallbackMessage
  }
}

export function formatTraceId(traceId?: string) {
  return traceId ? `错误编号：${traceId}` : ''
}

export function serializeApiError(error: unknown) {
  const apiError = normalizeApiError(error)

  if (!apiError) return error

  return {
    statusCode: apiError.statusCode,
    code: apiError.code,
    message: apiError.message,
    traceId: apiError.traceId,
    details: apiError.details
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return Boolean(error && typeof error === 'object' && 'statusCode' in error && 'code' in error)
}

function normalizeApiError(error: unknown): ApiClientError | null {
  if (!error || typeof error !== 'object') return null

  if (isApiClientError(error)) return error

  const candidate = error as {
    statusCode?: number
    status?: number
    code?: ApiErrorCode
    traceId?: string
    details?: unknown
    message?: string
    statusMessage?: string
    data?: {
      code?: ApiErrorCode
      message?: string
      traceId?: string
      details?: unknown
      data?: {
        code?: ApiErrorCode
        message?: string
        traceId?: string
        details?: unknown
      }
    }
  }
  const payload = candidate.data?.data || candidate.data
  const code = candidate.code || payload?.code

  if (!candidate.statusCode && !candidate.status && !code) return null

  const normalized = new Error(
    payload?.message || candidate.message || candidate.statusMessage || '请求失败'
  ) as ApiClientError

  normalized.statusCode = candidate.statusCode || candidate.status || 500
  normalized.code = code || statusToCode(normalized.statusCode)
  normalized.traceId = candidate.traceId || payload?.traceId
  normalized.details = candidate.details || payload?.details

  return normalized
}

function statusToCode(statusCode: number): ApiErrorCode {
  if (statusCode === 400) return 'BAD_REQUEST'
  if (statusCode === 401) return 'UNAUTHORIZED'
  if (statusCode === 403) return 'FORBIDDEN'
  if (statusCode === 404) return 'NOT_FOUND'
  if (statusCode === 422) return 'VALIDATION_ERROR'
  if (statusCode === 502) return 'UPSTREAM_ERROR'
  return 'INTERNAL_ERROR'
}
