import { randomUUID } from 'node:crypto'
import { defineEventHandler, getHeader, setHeader } from 'h3'

export default defineEventHandler((event) => {
  // ===== 用来帮助BFF+Koa层寻日志解决报错问题的, response header
  const requestId = getHeader(event, 'x-request-id') || randomUUID()
  setHeader(event, 'x-request-id', requestId)
  event.context.requestId = requestId
})
