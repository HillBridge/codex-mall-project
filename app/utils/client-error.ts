type ClientErrorSource =
  | 'vue:error'
  | 'app:error'
  | 'window:error'
  | 'unhandledrejection'
  | 'vite:preloadError'
  | 'error-boundary'

type ClientErrorContext = {
  source: ClientErrorSource
  info?: string
  fatal?: boolean
}

export type ClientErrorReport = {
  source: ClientErrorSource
  name: string
  message: string
  stack?: string
  info?: string
  fatal?: boolean
  url?: string
  userAgent?: string
  time: string
}

export function reportClientError(error: unknown, context: ClientErrorContext) {
  const normalized = normalizeClientError(error)

  const report: ClientErrorReport = {
    source: context.source,
    name: normalized.name,
    message: normalized.message,
    stack: normalized.stack,
    info: context.info,
    fatal: context.fatal,
    url: import.meta.client ? window.location.href : undefined,
    userAgent: import.meta.client ? window.navigator.userAgent : undefined,
    time: new Date().toISOString()
  }

  if (import.meta.dev) {
    console.error('[client-error]', report)
  }

  const reporter = import.meta.client
    ? (
        window as Window & {
          __NUXT_PILOT_REPORT_ERROR__?: (report: ClientErrorReport) => void
        }
      ).__NUXT_PILOT_REPORT_ERROR__
    : undefined

  reporter?.(report)

  return report
}

export function isChunkLoadError(error: unknown) {
  const message = normalizeClientError(error).message

  return [
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'error loading dynamically imported module',
    'Loading chunk',
    'ChunkLoadError',
    'CSS chunk'
  ].some((pattern) => message.includes(pattern))
}

export function normalizeClientError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message || '客户端运行异常',
      stack: error.stack
    }
  }

  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error
    }
  }

  if (error && typeof error === 'object') {
    const candidate = error as {
      name?: string
      message?: string
      stack?: string
      reason?: unknown
      error?: unknown
    }

    if (candidate.reason) return normalizeClientError(candidate.reason)
    if (candidate.error) return normalizeClientError(candidate.error)

    return {
      name: candidate.name || 'Error',
      message: candidate.message || '客户端运行异常',
      stack: candidate.stack
    }
  }

  return {
    name: 'Error',
    message: '客户端运行异常'
  }
}
