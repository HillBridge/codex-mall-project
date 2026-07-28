import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import process from 'node:process'
import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  LOGGED_IN_HINT_COOKIE_NAME,
  SESSION_COOKIE_NAME
} from '../constants/auth.mjs'
import { demoUser, toUserProfile } from '../data/users.mjs'

const SESSION_SECRET = process.env.BACKEND_SESSION_SECRET || 'nuxt-pilot-local-session-secret'

export function createSession(ctx, user) {
  const session = createSessionPayload(user)
  const token = createSessionToken(session)

  ctx.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isCookieSecure(ctx),
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS * 1000
  })
  ctx.cookies.set(LOGGED_IN_HINT_COOKIE_NAME, '1', {
    httpOnly: false,
    sameSite: 'lax',
    secure: isCookieSecure(ctx),
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS * 1000
  })
  ctx.cookies.set(CSRF_COOKIE_NAME, session.csrf, {
    httpOnly: false,
    sameSite: 'lax',
    secure: isCookieSecure(ctx),
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS * 1000
  })

  return token
}

export function getSessionUser(ctx) {
  const token = ctx.cookies.get(SESSION_COOKIE_NAME)
  if (!token) return null

  const session = verifySessionToken(token)
  if (!session) return null

  if (session.sub !== demoUser.id) return null
  return toUserProfile(demoUser)
}

export function clearSession(ctx) {
  ctx.cookies.set(SESSION_COOKIE_NAME, null, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isCookieSecure(ctx),
    path: '/',
    maxAge: 0
  })
  ctx.cookies.set(LOGGED_IN_HINT_COOKIE_NAME, null, {
    httpOnly: false,
    sameSite: 'lax',
    secure: isCookieSecure(ctx),
    path: '/',
    maxAge: 0
  })
  ctx.cookies.set(CSRF_COOKIE_NAME, null, {
    httpOnly: false,
    sameSite: 'lax',
    secure: isCookieSecure(ctx),
    path: '/',
    maxAge: 0
  })
}

export function isValidCsrfRequest(ctx) {
  const token = ctx.cookies.get(SESSION_COOKIE_NAME)
  const session = token ? verifySessionToken(token) : null
  const csrfCookie = ctx.cookies.get(CSRF_COOKIE_NAME)
  const csrfHeader = ctx.get(CSRF_HEADER_NAME)

  if (!session || !csrfCookie || !csrfHeader) return false
  return safeStringEqual(csrfCookie, session.csrf) && safeStringEqual(csrfHeader, session.csrf)
}

function createSessionPayload(user) {
  return {
    sub: user.id,
    sid: randomUUID(),
    csrf: randomUUID(),
    exp: Math.floor(Date.now() / 1000) + AUTH_COOKIE_MAX_AGE_SECONDS
  }
}

function createSessionToken(payload) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = sign(encodedPayload)

  return `${encodedPayload}.${signature}`
}

function verifySessionToken(token) {
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature || !isValidSignature(encodedPayload, signature)) return null

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))

    if (!payload || typeof payload.sub !== 'string') return null
    if (typeof payload.sid !== 'string' || typeof payload.csrf !== 'string') return null
    if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

function sign(value) {
  return createHmac('sha256', SESSION_SECRET).update(value).digest('base64url')
}

function isValidSignature(value, signature) {
  const expected = sign(value)
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(signature)

  if (expectedBuffer.length !== actualBuffer.length) return false
  return timingSafeEqual(expectedBuffer, actualBuffer)
}

function safeStringEqual(first, second) {
  const firstBuffer = Buffer.from(first)
  const secondBuffer = Buffer.from(second)

  if (firstBuffer.length !== secondBuffer.length) return false
  return timingSafeEqual(firstBuffer, secondBuffer)
}

function encodeBase64Url(value) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function isCookieSecure(ctx) {
  if (process.env.COOKIE_SECURE === 'true') return true
  if (process.env.COOKIE_SECURE === 'false') return false

  return ctx.secure || ctx.get('x-forwarded-proto') === 'https'
}
