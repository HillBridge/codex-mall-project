import { defineEventHandler, getCookie, getHeader, getRequestURL } from 'h3'
import type { H3Event } from 'h3'
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '~~/shared/constants/auth'
import { throwApiError } from '../utils/api-response'

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const csrfExemptPaths = new Set(['/api/auth/login'])

export default defineEventHandler((event) => {
  const requestURL = getRequestURL(event)
  const path = requestURL.pathname
  const method = event.method.toUpperCase()

  if (!path.startsWith('/api/') || !unsafeMethods.has(method)) {
    return
  }

  if (getHeader(event, 'x-requested-with') !== 'NuxtPilotClient') {
    throwApiError(event, {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: '缺少可信请求头'
    })
  }

  assertSameOrigin(event, requestURL)

  if (!csrfExemptPaths.has(path)) {
    assertCsrfToken(event)
  }
})

function assertSameOrigin(event: H3Event, requestURL: URL) {
  const origin = getHeader(event, 'origin')
  const referer = getHeader(event, 'referer')

  if (origin && origin !== requestURL.origin) {
    throwApiError(event, {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: '非法请求来源'
    })
  }

  if (!origin && referer && readOrigin(referer) !== requestURL.origin) {
    throwApiError(event, {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: '非法请求来源'
    })
  }
}

function assertCsrfToken(event: H3Event) {
  const csrfCookie = getCookie(event, CSRF_COOKIE_NAME)
  const csrfHeader = getHeader(event, CSRF_HEADER_NAME)

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    throwApiError(event, {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'CSRF 校验失败'
    })
  }
}

function readOrigin(value: string) {
  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}
