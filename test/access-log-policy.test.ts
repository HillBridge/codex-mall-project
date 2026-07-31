import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldWriteAccessLog } from '../server/utils/access-log-policy.ts'

test('records successful BFF API requests', () => {
  assert.equal(shouldWriteAccessLog('/api/auth/me', 200, 'production'), true)
})

test('ignores not-modified responses in every environment', () => {
  assert.equal(shouldWriteAccessLog('/api/products', 304, 'production'), false)
  assert.equal(shouldWriteAccessLog('/products/_payload.json', 304, 'development'), false)
})

test('ignores successful Nuxt payload and asset requests in production', () => {
  assert.equal(shouldWriteAccessLog('/account/profile', 200, 'production'), false)
  assert.equal(shouldWriteAccessLog('/products/_payload.json', 200, 'production'), false)
  assert.equal(shouldWriteAccessLog('/_payload.json', 304, 'production'), false)
  assert.equal(shouldWriteAccessLog('/_nuxt/app.abc123.js', 200, 'production'), false)
})

test('records failed Nuxt payload and asset requests in production', () => {
  assert.equal(shouldWriteAccessLog('/products/_payload.json', 404, 'production'), true)
  assert.equal(shouldWriteAccessLog('/_nuxt/app.abc123.js', 500, 'production'), true)
})

test('keeps page and internal request logs available during development', () => {
  assert.equal(shouldWriteAccessLog('/account/profile', 200, 'development'), true)
})

test('ignores successful Nuxt payload requests during development', () => {
  assert.equal(shouldWriteAccessLog('/_payload.json', 200, 'development'), false)
  assert.equal(shouldWriteAccessLog('/products/_payload.json', 200, 'development'), false)
  assert.equal(shouldWriteAccessLog('/products/_payload.json', 404, 'development'), true)
})
