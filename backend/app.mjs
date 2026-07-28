import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import { z } from 'zod'
import { demoUser, toUserProfile } from './data/users.mjs'
import { products, toProductSummary } from './data/products.mjs'
import { clearSession, createSession, getSessionUser, isValidCsrfRequest } from './services/session-service.mjs'
import { createHttpError } from './utils/http-error.mjs'
import { isValidServiceRequest } from './utils/service-auth.mjs'

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const serviceAuthExemptPaths = new Set(['/health'])

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

const productQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  featured: z.preprocess((value) => {
    if (value === true || value === 'true') return true
    if (value === false || value === 'false' || value === '' || value == null) return false
    return value
  }, z.boolean()).optional()
})

export function createBackendApp() {
  const app = new Koa()
  const router = new Router()

  app.use(async (ctx, next) => {
    ctx.state.traceId = ctx.get('x-request-id') || crypto.randomUUID()
    ctx.set('x-request-id', ctx.state.traceId)

    try {
      await next()
    } catch (error) {
      const statusCode = error.statusCode || error.status || 500
      ctx.status = statusCode
      ctx.body = {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || '服务暂时不可用',
        traceId: ctx.state.traceId,
        details: error.details
      }
    }
  })

  app.use(bodyParser())

  app.use(async (ctx, next) => {
    if (!serviceAuthExemptPaths.has(ctx.path) && !isValidServiceRequest(ctx)) {
      throw createHttpError(403, 'FORBIDDEN', '非法服务调用')
    }

    await next()
  })

  app.use(async (ctx, next) => {
    if (unsafeMethods.has(ctx.method.toUpperCase()) && ctx.path !== '/auth/login' && !isValidCsrfRequest(ctx)) {
      throw createHttpError(403, 'FORBIDDEN', 'CSRF 校验失败')
    }

    await next()
  })

  router.get('/health', (ctx) => {
    ctx.body = {
      ok: true,
      service: 'koa-backend',
      traceId: ctx.state.traceId
    }
  })

  router.post('/auth/login', (ctx) => {
    const parsed = loginSchema.safeParse(ctx.request.body)

    if (!parsed.success) {
      throw createHttpError(422, 'VALIDATION_ERROR', '登录参数不合法', parsed.error.flatten())
    }

    if (parsed.data.email !== demoUser.email || parsed.data.password !== demoUser.password) {
      throw createHttpError(401, 'UNAUTHORIZED', '邮箱或密码不正确')
    }

    const user = toUserProfile(demoUser)
    createSession(ctx, user)
    ctx.body = { user }
  })

  router.get('/auth/me', (ctx) => {
    const user = getSessionUser(ctx)

    if (!user) {
      throw createHttpError(401, 'UNAUTHORIZED', '未登录')
    }

    ctx.body = user
  })

  router.post('/auth/logout', (ctx) => {
    clearSession(ctx)
    ctx.body = { ok: true }
  })

  router.get('/products', (ctx) => {
    const parsed = productQuerySchema.safeParse(ctx.query)

    if (!parsed.success) {
      throw createHttpError(422, 'VALIDATION_ERROR', '商品筛选参数不合法', parsed.error.flatten())
    }

    const q = (parsed.data.q || '').trim().toLowerCase()
    const data = products
      .filter((product) => {
        if (parsed.data.featured && !product.featured) return false
        if (parsed.data.category && product.category !== parsed.data.category) return false
        if (!q) return true

        return [product.name, product.series, product.category, product.summary]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
      .map(toProductSummary)

    ctx.body = data
  })

  router.get('/products/:slug', (ctx) => {
    const product = products.find(item => item.slug === ctx.params.slug)

    if (!product) {
      throw createHttpError(404, 'NOT_FOUND', '商品不存在')
    }

    ctx.body = product
  })

  app.use(router.routes())
  app.use(router.allowedMethods())

  return app
}

export const app = createBackendApp()
