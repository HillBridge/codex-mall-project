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
    time: new Date().toISOString(),
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
  const message = [
    `[${String(level).toUpperCase()}]`,
    String(payload.scope || ''),
    payload.method ? String(payload.method) : '',
    payload.path ? String(payload.path) : '',
    payload.statusCode ? String(payload.statusCode) : '',
    payload.durationMs !== undefined ? `${String(payload.durationMs)}ms` : '',
    payload.traceId ? `traceId=${String(payload.traceId)}` : '',
    payload.errorCode ? `code=${String(payload.errorCode)}` : ''
  ].filter(Boolean).join(' ')

  if (level === 'error') console.error(message)
  else console.log(message)
}
