import { defineEventHandler, getHeader, getRequestURL } from 'h3'
import { throwApiError } from '../utils/api-response'

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
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
})
