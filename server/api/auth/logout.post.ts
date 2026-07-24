import { clearUserSession } from '../../utils/session'
import { apiOk } from '../../utils/api-response'

export default defineEventHandler((event) => {
  clearUserSession(event)
  return apiOk(event, { ok: true })
})
