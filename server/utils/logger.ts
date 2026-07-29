type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogFields = Record<string, unknown>

const levelWeights: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
}

export const logger = {
  debug(scope: string, fields: LogFields = {}) {
    writeLog('debug', scope, fields)
  },
  info(scope: string, fields: LogFields = {}) {
    writeLog('info', scope, fields)
  },
  warn(scope: string, fields: LogFields = {}) {
    writeLog('warn', scope, fields)
  },
  error(scope: string, fields: LogFields = {}) {
    writeLog('error', scope, fields)
  }
}

function writeLog(level: LogLevel, scope: string, fields: LogFields) {
  if (!shouldLog(level)) return

  const payload = {
    time: formatLogTime(new Date()),
    level,
    scope,
    ...fields
  }

  if (process.env.LOG_FORMAT === 'pretty') {
    writePrettyLog(level, payload)
    return
  }

  const line = JSON.stringify(payload)
  if (level === 'error') console.error(line)
  else console.log(line)
}

function shouldLog(level: LogLevel) {
  const configuredLevel = normalizeLevel(process.env.LOG_LEVEL)
  return levelWeights[level] >= levelWeights[configuredLevel]
}

function normalizeLevel(level?: string): LogLevel {
  if (level === 'debug' || level === 'info' || level === 'warn' || level === 'error') return level
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

function writePrettyLog(level: LogLevel, payload: LogFields) {
  const primary = [
    formatPrettyPrimaryField('time', payload.time),
    formatPrettyPrimaryField('level', String(level).toUpperCase()),
    formatPrettyPrimaryField('scope', payload.scope)
  ].filter(Boolean).join(' ')

  const details = [
    formatPrettyField('method', payload.method),
    formatPrettyField('path', payload.path),
    formatPrettyField('status', payload.statusCode),
    payload.durationMs !== undefined ? formatPrettyField('duration', `${String(payload.durationMs)}ms`) : '',
    formatPrettyField('traceId', payload.traceId),
    formatPrettyField('code', payload.errorCode)
  ].filter(Boolean).join(' | ')
  const message = [primary, details].filter(Boolean).join(' | ')

  if (level === 'error') console.error(message)
  else console.log(message)
}

function formatLogTime(date: Date) {
  const year = date.getFullYear()
  const month = padTimePart(date.getMonth() + 1)
  const day = padTimePart(date.getDate())
  const hour = padTimePart(date.getHours())
  const minute = padTimePart(date.getMinutes())
  const second = padTimePart(date.getSeconds())

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

function padTimePart(value: number) {
  return String(value).padStart(2, '0')
}

function formatPrettyField(label: string, value: unknown) {
  if (value === undefined || value === null || value === '') return ''
  return `${label}: ${String(value)}`
}

function formatPrettyPrimaryField(label: string, value: unknown) {
  const field = formatPrettyField(label, value)
  return field ? `[${field}]` : ''
}
