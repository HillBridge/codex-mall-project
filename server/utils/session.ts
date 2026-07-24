import process from 'node:process'
import type { H3Event } from 'h3'
import { AUTH_COOKIE_MAX_AGE, LOGGED_IN_HINT_COOKIE_NAME, SESSION_COOKIE_NAME } from '~~/shared/constants/auth'
import type { UserProfile } from '~~/shared/types/user'

const sessions = new Map<string, UserProfile>()

export function createSession(event: H3Event, user: UserProfile) {
  const token = crypto.randomUUID()
  sessions.set(token, user)

  setCookie(event, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE
  })
  setCookie(event, LOGGED_IN_HINT_COOKIE_NAME, '1', {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE
  })

  return token
}

export function getSessionUser(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE_NAME)
  if (!token) return null
  return sessions.get(token) || null
}

export function clearUserSession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE_NAME)
  if (token) {
    sessions.delete(token)
  }

  deleteCookie(event, SESSION_COOKIE_NAME, {
    path: '/'
  })
  deleteCookie(event, LOGGED_IN_HINT_COOKIE_NAME, {
    path: '/'
  })
}
