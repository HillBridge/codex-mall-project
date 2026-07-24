import { getSessionUser } from '../../utils/session'
import { apiOk, throwApiError } from '../../utils/api-response'

export default defineEventHandler((event) => {
  const user = getSessionUser(event)

  if (!user) {
    throwApiError(event, {
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: '未登录'
    })
  }

  return apiOk(event, user)
})
