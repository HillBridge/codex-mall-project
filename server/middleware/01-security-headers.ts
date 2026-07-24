export default defineEventHandler((event) => {
  setHeader(event, 'x-content-type-options', 'nosniff')
  setHeader(event, 'referrer-policy', 'strict-origin-when-cross-origin')
  setHeader(event, 'permissions-policy', 'camera=(), microphone=(), geolocation=()')
  setHeader(event, 'x-frame-options', 'DENY')
  setHeader(event, 'cross-origin-opener-policy', 'same-origin')
  setHeader(event, 'cross-origin-resource-policy', 'same-origin')
  setHeader(
    event,
    'strict-transport-security',
    'max-age=31536000; includeSubDomains; preload'
  )
  setHeader(
    event,
    'content-security-policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://images.unsplash.com",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  )
})
