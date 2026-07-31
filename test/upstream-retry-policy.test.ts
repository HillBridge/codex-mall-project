import assert from 'node:assert/strict'
import test from 'node:test'
import { getUpstreamMaxAttempts } from '../server/utils/upstream-retry-policy.ts'

test('allows one retry for safe and idempotent read methods', () => {
  assert.equal(getUpstreamMaxAttempts('GET'), 2)
  assert.equal(getUpstreamMaxAttempts('HEAD'), 2)
  assert.equal(getUpstreamMaxAttempts('OPTIONS'), 2)
})

test('does not retry write methods by default', () => {
  assert.equal(getUpstreamMaxAttempts('POST'), 1)
  assert.equal(getUpstreamMaxAttempts('PUT'), 1)
  assert.equal(getUpstreamMaxAttempts('PATCH'), 1)
  assert.equal(getUpstreamMaxAttempts('DELETE'), 1)
})
