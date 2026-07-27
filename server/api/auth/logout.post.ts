import { defineEventHandler } from 'h3'
import { apiOk } from '../../utils/api-response'
import { createUpstreamClient } from '../../utils/upstream'

export default defineEventHandler(async (event) => {
  const upstreamFetch = createUpstreamClient(event)
  const data = await upstreamFetch<{ ok: true }>('/auth/logout', { method: 'POST' })

  return apiOk(event, data)
})
