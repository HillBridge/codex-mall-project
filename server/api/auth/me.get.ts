import { defineEventHandler } from 'h3'
import { apiOk } from '../../utils/api-response'
import { createUpstreamClient } from '../../utils/upstream'
import type { UserProfile } from '~~/shared/types/user'

export default defineEventHandler((event) => {
  const upstreamFetch = createUpstreamClient(event)

  return upstreamFetch<UserProfile>('/auth/me').then((user) => apiOk(event, user))
})
