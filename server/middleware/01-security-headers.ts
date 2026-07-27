import { defineEventHandler, setHeader } from 'h3'

const isDevelopment = process.env.NODE_ENV !== 'production'

function createContentSecurityPolicy() {
  const directives = [
    "default-src 'self'",
    isDevelopment
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self'",
    isDevelopment
      ? "style-src 'self' 'unsafe-inline'"
      : "style-src 'self'",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "font-src 'self' data:",
    isDevelopment
      ? "connect-src 'self' http: https: ws: wss:"
      : "connect-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ]

  if (!isDevelopment) {
    directives.push('upgrade-insecure-requests')
  }

  return directives.join('; ')
}

export default defineEventHandler((event) => {
  setHeader(event, 'x-content-type-options', 'nosniff')
  setHeader(event, 'referrer-policy', 'strict-origin-when-cross-origin')
  setHeader(event, 'permissions-policy', 'camera=(), microphone=(), geolocation=()')
  setHeader(event, 'x-frame-options', 'DENY')
  setHeader(event, 'cross-origin-opener-policy', 'same-origin')
  setHeader(event, 'cross-origin-resource-policy', 'same-origin')

  if (!isDevelopment) {
    setHeader(
      event,
      'strict-transport-security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  setHeader(event, 'content-security-policy', createContentSecurityPolicy())
})
