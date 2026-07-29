import { defineEventHandler, getHeader, getRequestURL } from 'h3'
import { getTraceId } from '../utils/api-response'
import { logger } from '../utils/logger'

export default defineEventHandler((event) => {
  const startedAt = Date.now()
  const requestURL = getRequestURL(event)

  event.node.res.on('finish', () => {
    const statusCode = event.node.res.statusCode
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    logger[level]('bff.access', {
      traceId: getTraceId(event),
      method: event.method,
      path: requestURL.pathname,
      statusCode,
      durationMs: Date.now() - startedAt,
      queryKeys: [...requestURL.searchParams.keys()],
      userAgent: simplifyUserAgent(getHeader(event, 'user-agent'))
    })
  })
})

function simplifyUserAgent(value?: string) {
  if (!value) return undefined
  return value.slice(0, 120)
}
