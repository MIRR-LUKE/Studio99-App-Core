import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import { env } from '@/lib/env'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const RECOVERY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const TOTP_DIGITS = 6
const TOTP_PERIOD_SECONDS = 30
const TOTP_WINDOW = 1

const normalizeSecret = (value: string) => value.replace(/[\s-]+/g, '').toUpperCase()
const normalizeToken = (value: string) => value.replace(/\s+/g, '')
const normalizeRecoveryCode = (value: string) => value.replace(/[\s-]+/g, '').toUpperCase()

const toBase32 = (buffer: Uint8Array) => {
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  return output
}

const fromBase32 = (value: string) => {
  const normalized = normalizeSecret(value)
  let bits = 0
  let accumulator = 0
  const bytes: number[] = []

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) {
      throw new Error('Invalid MFA secret format.')
    }

    accumulator = (accumulator << 5) | index
    bits += 5

    if (bits >= 8) {
      bytes.push((accumulator >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return Buffer.from(bytes)
}

const leftPad = (value: string, length: number) => value.padStart(length, '0')

const formatManualEntryKey = (secret: string) => secret.match(/.{1,4}/g)?.join(' ') ?? secret

const generateCounterBuffer = (counter: number) => {
  const buffer = Buffer.alloc(8)
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buffer.writeUInt32BE(counter >>> 0, 4)
  return buffer
}

const generateOtpForCounter = (secret: string, counter: number) => {
  const secretBytes = fromBase32(secret)
  const digest = createHmac('sha1', secretBytes).update(generateCounterBuffer(counter)).digest()
  const offset = digest[digest.length - 1] & 0x0f
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)

  return leftPad(String(code % 10 ** TOTP_DIGITS), TOTP_DIGITS)
}

const hashRecoveryCode = (code: string) =>
  createHash('sha256')
    .update(`${env.PAYLOAD_SECRET}:${normalizeRecoveryCode(code)}`)
    .digest('hex')

const constantTimeEquals = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

export const MFA_POLICY = {
  digits: TOTP_DIGITS,
  periodSeconds: TOTP_PERIOD_SECONDS,
  window: TOTP_WINDOW,
} as const

export const createMfaEnrollmentSecret = () => {
  const secret = toBase32(randomBytes(20))

  return {
    manualEntryKey: formatManualEntryKey(secret),
    secret,
  }
}

export const createOtpAuthUri = ({
  email,
  issuer = 'Studio99 Application Core',
  secret,
}: {
  email: string
  issuer?: string
  secret: string
}) => {
  const accountName = encodeURIComponent(email)
  const encodedIssuer = encodeURIComponent(issuer)

  return `otpauth://totp/${encodedIssuer}:${accountName}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD_SECONDS}`
}

export const verifyTotpToken = ({
  secret,
  token,
  window = TOTP_WINDOW,
}: {
  secret: string
  token: string
  window?: number
}) => {
  const normalizedToken = normalizeToken(token)

  if (!/^\d{6}$/.test(normalizedToken)) {
    return false
  }

  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS)

  for (let offset = -window; offset <= window; offset += 1) {
    if (generateOtpForCounter(secret, currentCounter + offset) === normalizedToken) {
      return true
    }
  }

  return false
}

const randomRecoveryChunk = (length: number) => {
  const bytes = randomBytes(length)
  let output = ''

  for (let index = 0; index < length; index += 1) {
    output += RECOVERY_CODE_ALPHABET[bytes[index] % RECOVERY_CODE_ALPHABET.length]
  }

  return output
}

export const generateRecoveryCodes = (count = 8) => {
  const codes = Array.from({ length: count }, () => `${randomRecoveryChunk(4)}-${randomRecoveryChunk(4)}`)

  return {
    codes,
    hashes: codes.map(hashRecoveryCode),
  }
}

export const verifyRecoveryCode = ({
  code,
  hashes,
}: {
  code: string
  hashes: string[]
}) => {
  const hashedCandidate = hashRecoveryCode(code)
  const matchedHash = hashes.find((hash) => constantTimeEquals(hash, hashedCandidate))

  if (!matchedHash) {
    return null
  }

  return {
    matchedHash,
    remainingHashes: hashes.filter((hash) => !constantTimeEquals(hash, hashedCandidate)),
  }
}

export const getMaskedRecoveryCodeCount = (hashes: unknown) => (Array.isArray(hashes) ? hashes.length : 0)
