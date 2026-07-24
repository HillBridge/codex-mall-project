export default defineEventHandler((event) => {
  const requestId = getHeader(event, 'x-request-id') || crypto.randomUUID()
  setHeader(event, 'x-request-id', requestId)
  event.context.requestId = requestId
})
