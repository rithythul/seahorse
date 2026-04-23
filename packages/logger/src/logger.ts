type Level = 'debug' | 'info' | 'warn' | 'error'

export interface Logger {
  debug: (msg: string, ...args: unknown[]) => void
  info: (msg: string, ...args: unknown[]) => void
  warn: (msg: string, ...args: unknown[]) => void
  error: (msg: string, ...args: unknown[]) => void
}

const LEVEL_ORDER: Record<Level, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const COLORS: Record<Level, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
}

const RESET = '\x1b[0m'

function getMinLevel(): Level {
  const envLevel = process.env.SEAHORSE_LOG_LEVEL as Level | undefined
  return envLevel && LEVEL_ORDER[envLevel] !== undefined ? envLevel : 'info'
}

function getPrefix(level: Level, useColor: boolean): string {
  const minLevel = getMinLevel()
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) {
    return '' // Won't be used, but this is the marker
  }

  const useDebugTimestamp = minLevel === 'debug'
  const timestamp = useDebugTimestamp ? new Date().toISOString() + ' ' : ''

  const color = useColor ? COLORS[level] : ''
  const reset = useColor ? RESET : ''
  const levelStr = level.padEnd(5)
  return `${color}[seahorse] ${timestamp}${levelStr}${reset}  `
}

function shouldLog(level: Level): boolean {
  const minLevel = getMinLevel()
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel]
}

export const logger: Logger = {
  debug(msg: string, ...args: unknown[]): void {
    if (!shouldLog('debug')) return
    const useColor = !process.env.NO_COLOR
    const prefix = getPrefix('debug', useColor)
    console.log(prefix + msg, ...args)
  },

  info(msg: string, ...args: unknown[]): void {
    if (!shouldLog('info')) return
    const useColor = !process.env.NO_COLOR
    const prefix = getPrefix('info', useColor)
    console.log(prefix + msg, ...args)
  },

  warn(msg: string, ...args: unknown[]): void {
    if (!shouldLog('warn')) return
    const useColor = !process.env.NO_COLOR
    const prefix = getPrefix('warn', useColor)
    console.log(prefix + msg, ...args)
  },

  error(msg: string, ...args: unknown[]): void {
    if (!shouldLog('error')) return
    const useColor = !process.env.NO_COLOR
    const prefix = getPrefix('error', useColor)
    console.error(prefix + msg, ...args)
  },
}
