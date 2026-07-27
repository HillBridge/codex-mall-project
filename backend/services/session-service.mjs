import { randomUUID } from 'node:crypto'
import process from 'node:process'
import { AUTH_COOKIE_MAX_AGE_SECONDS, LOGGED_IN_HINT_COOKIE_NAME, SESSION_COOKIE_NAME } from '../constants/auth.mjs'

const sessions = new Map()

export function createSession(ctx, user) {
  const token = randomUUID()
  sessions.set(token, user)

  ctx.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS * 1000
  })
  ctx.cookies.set(LOGGED_IN_HINT_COOKIE_NAME, '1', {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS * 1000
  })

  return token
}

export function getSessionUser(ctx) {
  const token = ctx.cookies.get(SESSION_COOKIE_NAME)
  if (!token) return null
  return sessions.get(token) || null
}

export function clearSession(ctx) {
  const token = ctx.cookies.get(SESSION_COOKIE_NAME)
  if (token) {
    sessions.delete(token)
  }

  ctx.cookies.set(SESSION_COOKIE_NAME, null, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  })
  ctx.cookies.set(LOGGED_IN_HINT_COOKIE_NAME, null, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  })
}
