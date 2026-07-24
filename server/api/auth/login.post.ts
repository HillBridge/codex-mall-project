import { z } from 'zod'
import { demoUser } from '../../utils/mock-data'
import { apiOk, throwApiError } from '../../utils/api-response'
import { createSession } from '../../utils/session'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export default defineEventHandler(async (event) => {
  const parsed = loginSchema.safeParse(await readBody(event))

  if (!parsed.success) {
    throwApiError(event, {
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: '登录参数不合法',
      details: parsed.error.flatten()
    })
  }

  const payload = parsed.data

  if (payload.email !== demoUser.email || payload.password !== demoUser.password) {
    throwApiError(event, {
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: '邮箱或密码不正确'
    })
  }

  const { password, ...user } = demoUser
  createSession(event, user)

  return apiOk(event, { user })
})
