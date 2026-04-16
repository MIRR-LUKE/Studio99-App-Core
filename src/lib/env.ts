const requiredEnvKeys = ['DATABASE_URL', 'PAYLOAD_SECRET', 'NEXT_PUBLIC_SERVER_URL'] as const

type RequiredEnvKey = (typeof requiredEnvKeys)[number]

const storageProviders = ['local', 's3'] as const
type StorageProvider = (typeof storageProviders)[number]
const authCookieSameSiteValues = ['Lax', 'None', 'Strict'] as const
type AuthCookieSameSite = (typeof authCookieSameSiteValues)[number]

function requireEnv(key: RequiredEnvKey): string {
  const value = process.env[key]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key]?.trim() || fallback
}

function booleanEnv(key: string, fallback: boolean): boolean {
  const value = process.env[key]?.trim().toLowerCase()

  if (!value) {
    return fallback
  }

  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  throw new Error(`Environment variable ${key} must be "true" or "false".`)
}

function integerEnv(key: string, fallback: number): number {
  const value = process.env[key]?.trim()

  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed)) {
    throw new Error(`Environment variable ${key} must be an integer.`)
  }

  return parsed
}

function enumEnv<TValue extends string>(
  key: string,
  values: readonly TValue[],
  fallback: TValue,
): TValue {
  const value = process.env[key]?.trim()

  if (!value) {
    return fallback
  }

  if (values.includes(value as TValue)) {
    return value as TValue
  }

  throw new Error(`Environment variable ${key} must be one of: ${values.join(', ')}`)
}

function requireWhen(condition: boolean, key: string): string {
  const value = process.env[key]?.trim()

  if (!condition) {
    return value || ''
  }

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

const storageProvider = enumEnv<StorageProvider>('STORAGE_PROVIDER', storageProviders, 'local')
const stripeEnabled = booleanEnv('STRIPE_ENABLED', false)
const authCookieSameSite = enumEnv<AuthCookieSameSite>(
  'AUTH_COOKIE_SAME_SITE',
  authCookieSameSiteValues,
  'Lax',
)

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  NEXT_PUBLIC_SERVER_URL: requireEnv('NEXT_PUBLIC_SERVER_URL'),
  PAYLOAD_SECRET: requireEnv('PAYLOAD_SECRET'),
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  mail: {
    enabled: booleanEnv('SMTP_ENABLED', true),
    host: optionalEnv('SMTP_HOST', 'localhost'),
    port: integerEnv('SMTP_PORT', 1025),
    user: optionalEnv('SMTP_USER'),
    pass: optionalEnv('SMTP_PASS'),
    from: optionalEnv('EMAIL_FROM', 'Studio99 <noreply@studio99.local>'),
    mailpitUrl: optionalEnv('MAILPIT_UI_URL', 'http://localhost:8025'),
  },
  storage: {
    provider: storageProvider,
    bucket: requireWhen(storageProvider === 's3', 'S3_BUCKET'),
    region: optionalEnv('S3_REGION', 'ap-northeast-1'),
    endpoint: optionalEnv('S3_ENDPOINT', 'http://localhost:9000'),
    accessKeyId: requireWhen(storageProvider === 's3', 'S3_ACCESS_KEY_ID'),
    secretAccessKey: requireWhen(storageProvider === 's3', 'S3_SECRET_ACCESS_KEY'),
    forcePathStyle: booleanEnv('S3_FORCE_PATH_STYLE', true),
    minioConsoleUrl: optionalEnv('MINIO_CONSOLE_URL', 'http://localhost:9001'),
  },
  stripe: {
    enabled: stripeEnabled,
    secretKey: requireWhen(stripeEnabled, 'STRIPE_SECRET_KEY'),
    webhookSecret: requireWhen(stripeEnabled, 'STRIPE_WEBHOOK_SECRET'),
    priceId: optionalEnv('STRIPE_PRICE_ID'),
    productId: optionalEnv('STRIPE_PRODUCT_ID'),
    webhookForwardTo: optionalEnv(
      'STRIPE_WEBHOOK_FORWARD_TO',
      'http://host.docker.internal:3000/api/stripe/webhook',
    ),
  },
  auth: {
    cookieDomain: optionalEnv('AUTH_COOKIE_DOMAIN') || undefined,
    cookieSameSite: authCookieSameSite,
    cookieSecure: booleanEnv('AUTH_COOKIE_SECURE', optionalEnv('NODE_ENV', 'development') === 'production'),
    forgotPasswordExpirationMs: integerEnv('AUTH_FORGOT_PASSWORD_EXPIRATION_MS', 60 * 60 * 1000),
    lockTimeMs: integerEnv('AUTH_LOCK_TIME_MS', 10 * 60 * 1000),
    maxLoginAttempts: integerEnv('AUTH_MAX_LOGIN_ATTEMPTS', 5),
    removeTokenFromResponses: booleanEnv('AUTH_REMOVE_TOKEN_FROM_RESPONSES', true),
    tokenExpirationSeconds: integerEnv('AUTH_TOKEN_EXPIRATION', 2 * 60 * 60),
    useSessions: booleanEnv('AUTH_USE_SESSIONS', true),
    verifyEmail: booleanEnv('AUTH_VERIFY_EMAIL', true),
  },
} as const
