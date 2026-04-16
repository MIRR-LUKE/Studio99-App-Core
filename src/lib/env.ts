const requiredEnvKeys = ['DATABASE_URL', 'PAYLOAD_SECRET', 'NEXT_PUBLIC_SERVER_URL'] as const

type RequiredEnvKey = (typeof requiredEnvKeys)[number]

function requireEnv(key: RequiredEnvKey): string {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  NEXT_PUBLIC_SERVER_URL: requireEnv('NEXT_PUBLIC_SERVER_URL'),
  PAYLOAD_SECRET: requireEnv('PAYLOAD_SECRET'),
} as const
