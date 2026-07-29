import { randomUUID } from 'node:crypto'
import { createError, getHeader } from 'h3'
import type { H3Event } from 'h3'
import type { ApiErrorCode, ApiFailure, ApiSuccess } from '~~/shared/types/api'

type ApiErrorInput = {
  statusCode?: number
  code: ApiErrorCode
  message: string
  details?: unknown
}

export function getTraceId(event: H3Event) {
  return String(event.context.requestId || getHeader(event, 'x-request-id') || randomUUID())
}

export function apiOk<T>(event: H3Event, data: T): ApiSuccess<T> {
  return {
    data,
    traceId: getTraceId(event)
  }
}

export function throwApiError(event: H3Event, input: ApiErrorInput): never {
  const payload: ApiFailure = {
    code: input.code,
    message: input.message,
    traceId: getTraceId(event)
  }

  if (shouldExposeDetails() && input.details !== undefined) {
    payload.details = input.details
  }

  throw createError({
    statusCode: input.statusCode || 500,
    message: input.message,
    data: payload
  })
}

function shouldExposeDetails() {
  return process.env.NODE_ENV !== 'production'
}
