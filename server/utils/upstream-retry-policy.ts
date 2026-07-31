export type UpstreamHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

const retryableMethods = new Set<UpstreamHttpMethod>(['GET', 'HEAD', 'OPTIONS'])

export function getUpstreamMaxAttempts(method: UpstreamHttpMethod) {
  return retryableMethods.has(method) ? 2 : 1
}
