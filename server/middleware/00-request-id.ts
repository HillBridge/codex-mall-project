import { randomUUID } from 'node:crypto'
import { defineEventHandler, getHeader, setHeader } from 'h3'

export default defineEventHandler((event) => {
  const requestId = getHeader(event, 'x-request-id') || randomUUID()
  setHeader(event, 'x-request-id', requestId)
  event.context.requestId = requestId
})
