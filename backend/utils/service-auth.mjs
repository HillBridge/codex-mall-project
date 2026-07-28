import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import process from 'node:process'
import {
  SERVICE_ID_HEADER,
  SERVICE_SIGNATURE_HEADER,
  SERVICE_TIMESTAMP_HEADER,
  SERVICE_TOKEN_HEADER
} from '../constants/service-auth.mjs'

const SERVICE_SIGNATURE_TOLERANCE_SECONDS = 300
const DEFAULT_SERVICE_ID = 'nuxt-bff'
const DEFAULT_SERVICE_TOKEN = 'nuxt-pilot-local-service-token'
const DEFAULT_SERVICE_SIGNATURE_SECRET = 'nuxt-pilot-local-service-signature-secret'

export function isValidServiceRequest(ctx) {
  const serviceId = ctx.get(SERVICE_ID_HEADER)
  const serviceToken = ctx.get(SERVICE_TOKEN_HEADER)
  const timestamp = ctx.get(SERVICE_TIMESTAMP_HEADER)
  const signature = ctx.get(SERVICE_SIGNATURE_HEADER)
  const expectedServiceId = getRequiredServiceId()
  const expectedServiceToken = getRequiredServiceToken()
  const signatureSecret = getRequiredSignatureSecret()

  if (!expectedServiceId || !expectedServiceToken || !signatureSecret) return false
  if (!serviceId || !serviceToken || !timestamp || !signature) return false
  if (!safeStringEqual(serviceId, expectedServiceId)) return false
  if (!safeStringEqual(serviceToken, expectedServiceToken)) return false
  if (!isFreshTimestamp(timestamp)) return false

  const expectedSignature = createServiceSignature({
    secret: signatureSecret,
    serviceId,
    timestamp,
    method: ctx.method,
    path: createSignedPath(ctx),
    body: ctx.request.rawBody || ''
  })

  return safeStringEqual(signature, expectedSignature)
}

function createServiceSignature({ secret, serviceId, timestamp, method, path, body }) {
  const payload = [
    method.toUpperCase(),
    path,
    hashBody(body),
    timestamp,
    serviceId
  ].join('\n')

  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function createSignedPath(ctx) {
  return ctx.querystring ? `${ctx.path}?${ctx.querystring}` : ctx.path
}

function hashBody(body) {
  return createHash('sha256').update(body).digest('base64url')
}

function isFreshTimestamp(value) {
  const timestamp = Number(value)
  if (!Number.isInteger(timestamp)) return false

  const now = Math.floor(Date.now() / 1000)
  return Math.abs(now - timestamp) <= SERVICE_SIGNATURE_TOLERANCE_SECONDS
}

function getRequiredServiceId() {
  return process.env.BACKEND_TRUSTED_SERVICE_ID || process.env.BFF_SERVICE_ID || DEFAULT_SERVICE_ID
}

function getRequiredServiceToken() {
  return process.env.BACKEND_SERVICE_TOKEN || process.env.BFF_SERVICE_TOKEN || getLocalDefault(DEFAULT_SERVICE_TOKEN)
}

function getRequiredSignatureSecret() {
  return process.env.BACKEND_SERVICE_SIGNATURE_SECRET || process.env.BFF_SERVICE_SIGNATURE_SECRET || getLocalDefault(DEFAULT_SERVICE_SIGNATURE_SECRET)
}

function getLocalDefault(value) {
  return process.env.NODE_ENV === 'production' ? '' : value
}

function safeStringEqual(first, second) {
  const firstBuffer = Buffer.from(first)
  const secondBuffer = Buffer.from(second)

  if (firstBuffer.length !== secondBuffer.length) return false
  return timingSafeEqual(firstBuffer, secondBuffer)
}
