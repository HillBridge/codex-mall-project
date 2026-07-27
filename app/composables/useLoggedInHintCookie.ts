import { useCookie } from '#app/composables/cookie'
import { AUTH_COOKIE_MAX_AGE, LOGGED_IN_HINT_COOKIE_NAME } from '~~/shared/constants/auth'

export function useLoggedInHintCookie() {
  return useCookie<'1' | null>(LOGGED_IN_HINT_COOKIE_NAME, {
    maxAge: AUTH_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: import.meta.client ? window.location.protocol === 'https:' : undefined,
    path: '/',
    encode: value => String(value),
    decode: value => value === '1' ? '1' : null
  })
}
