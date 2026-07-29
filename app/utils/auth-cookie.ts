import { CSRF_COOKIE_NAME, LOGGED_IN_HINT_COOKIE_NAME } from '~~/shared/constants/auth'

export function hasLoggedInHintCookie() {
  if (!import.meta.client) return false

  return isLoggedInHintValue(readBrowserCookie(LOGGED_IN_HINT_COOKIE_NAME) || '')
}

export function readCsrfCookie() {
  if (!import.meta.client) return ''
  return readBrowserCookie(CSRF_COOKIE_NAME) || ''
}

function readBrowserCookie(name: string) {
  const cookie = document.cookie.split(';').find((item) => item.trim().startsWith(`${name}=`))

  if (!cookie) return ''

  const [, ...rawValueParts] = cookie.trim().split('=')
  return rawValueParts.join('=')
}

function isLoggedInHintValue(value: string) {
  if (value === '1') return true

  try {
    const decodedValue = decodeURIComponent(value)
    if (decodedValue === '1') return true

    return JSON.parse(decodedValue) === '1'
  } catch {
    return false
  }
}
