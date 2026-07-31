export function shouldWriteAccessLog(path: string, statusCode: number, nodeEnv?: string) {
  if (statusCode === 304) return false
  if (statusCode >= 400) return true
  if (path.endsWith('/_payload.json')) return false
  if (nodeEnv !== 'production') return true
  return path === '/api' || path.startsWith('/api/')
}
