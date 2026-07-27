import { LOGGED_IN_HINT_COOKIE_NAME } from '~~/shared/constants/auth'

export function hasLoggedInHintCookie() {
  if (!import.meta.client) return false

  return document.cookie
    .split(';')
    .some((item) => {
      const [rawName, ...rawValueParts] = item.trim().split('=')
      if (rawName !== LOGGED_IN_HINT_COOKIE_NAME) return false

      return isLoggedInHintValue(rawValueParts.join('='))
    })
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
