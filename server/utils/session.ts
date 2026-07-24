import process from 'node:process'
import type { H3Event } from 'h3'
import type { UserProfile } from '~~/shared/types/user'

const SESSION_COOKIE = 'nuxt_pilot_session'
const LOGGED_IN_HINT_COOKIE = 'nuxt_pilot_logged_in'
const sessions = new Map<string, UserProfile>()

export function createSession(event: H3Event, user: UserProfile) {
  const token = crypto.randomUUID()
  sessions.set(token, user)

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })
  setCookie(event, LOGGED_IN_HINT_COOKIE, '1', {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })

  return token
}

export function getSessionUser(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null
  return sessions.get(token) || null
}

export function clearUserSession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    sessions.delete(token)
  }

  deleteCookie(event, SESSION_COOKIE, {
    path: '/'
  })
  deleteCookie(event, LOGGED_IN_HINT_COOKIE, {
    path: '/'
  })
}
