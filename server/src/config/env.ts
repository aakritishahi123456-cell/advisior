const PLACEHOLDER_PATTERNS = ['your-', 'change-this', 'placeholder', 'example', 'replace-with']

function isPlaceholder(value: string) {
  const normalized = value.toLowerCase()
  return PLACEHOLDER_PATTERNS.some((pattern) => normalized.includes(pattern))
}

export function getEnvNumber(name: string, fallback: number): number {
  const rawValue = process.env[name]
  if (!rawValue) {
    return fallback
  }

  const parsed = Number(rawValue)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function getEnvBoolean(name: string, fallback: boolean): boolean {
  const rawValue = process.env[name]
  if (!rawValue) {
    return fallback
  }

  return ['1', 'true', 'yes', 'on'].includes(rawValue.toLowerCase())
}

export function validateEnvironment() {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'FRONTEND_URL']
  const missing = required.filter((name) => !process.env[name])
  const insecure = required.filter((name) => {
    const value = process.env[name]
    return value ? value.length < 12 || isPlaceholder(value) : false
  })

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    insecure.push('JWT_SECRET')
  }

  if (missing.length > 0 || insecure.length > 0) {
    const details = [
      missing.length > 0 ? `missing: ${missing.join(', ')}` : null,
      insecure.length > 0 ? `insecure: ${Array.from(new Set(insecure)).join(', ')}` : null,
    ]
      .filter(Boolean)
      .join('; ')

    throw new Error(`Production environment validation failed: ${details}`)
  }
}
