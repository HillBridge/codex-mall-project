import { apiOk } from '../../utils/api-response'
import { createUpstreamClient } from '../../utils/upstream'
import type { UserProfile } from '~~/shared/types/user'

export default defineEventHandler(async (event) => {
  const upstreamFetch = createUpstreamClient(event)
  const data = await upstreamFetch<{ user: UserProfile }>('/auth/login', {
    method: 'POST',
    body: await readBody(event)
  })

  return apiOk(event, data)
})
