import type { PayloadRequest } from 'payload'

import {
  MFA_POLICY,
  createMfaEnrollmentSecret,
  createOtpAuthUri,
  generateRecoveryCodes,
  getMaskedRecoveryCodeCount,
  verifyRecoveryCode,
  verifyTotpToken,
} from '@/core/security/mfa'
import { createSystemLocalApi } from '@/core/server/localApi'
import { recordAuditEvent, withAuditDisabledContext } from '@/core/hooks/audit'

type UserMfaState = {
  displayName?: null | string
  email?: null | string
  id: number | string
  security?: {
    mfa?: {
      enabled?: boolean | null
      enrolledAt?: null | string
      pendingSecret?: null | string
      preferredMethod?: null | string
      recoveryCodeHashes?: null | string[]
      recoveryCodeVersion?: null | number
      secret?: null | string
      verifiedAt?: null | string
    } | null
  } | null
}

const getSystemApi = (req: PayloadRequest, reason: string) => createSystemLocalApi(req, reason)

const getUserState = async (req: PayloadRequest) => {
  const userId = req.user?.id
  if (!userId) {
    throw new Error('Authentication required.')
  }

  const api = getSystemApi(req, 'read current user mfa state')
  const user = (await api.findByID({
    collection: 'users',
    depth: 0,
    id: userId,
  })) as UserMfaState | null

  if (!user) {
    throw new Error('User not found.')
  }

  return user
}

const nextRecoveryCodeVersion = (value: null | number | undefined) => Number(value ?? 0) + 1

const baseMfaData = (user: UserMfaState) => ({
  enabled: Boolean(user.security?.mfa?.enabled),
  enrolledAt: user.security?.mfa?.enrolledAt ?? null,
  pendingSecret: user.security?.mfa?.pendingSecret ?? null,
  preferredMethod: user.security?.mfa?.preferredMethod ?? 'totp',
  recoveryCodeCount: getMaskedRecoveryCodeCount(user.security?.mfa?.recoveryCodeHashes),
  recoveryCodeVersion: Number(user.security?.mfa?.recoveryCodeVersion ?? 0),
  verifiedAt: user.security?.mfa?.verifiedAt ?? null,
})

export const getCurrentUserMfaOverview = async (req: PayloadRequest) => {
  const user = await getUserState(req)
  const mfa = baseMfaData(user)

  return {
    ...mfa,
    email: user.email ?? '',
    hasPendingEnrollment: Boolean(mfa.pendingSecret),
    policy: MFA_POLICY,
    userId: user.id,
  }
}

export const beginTotpEnrollment = async (req: PayloadRequest) => {
  const user = await getUserState(req)
  const { manualEntryKey, secret } = createMfaEnrollmentSecret()
  const api = getSystemApi(req, 'begin mfa enrollment')

  await api.update({
    collection: 'users',
    context: withAuditDisabledContext(req.context),
    data: {
      security: {
        ...(user.security ?? {}),
        mfa: {
          ...(user.security?.mfa ?? {}),
          enabled: false,
          pendingSecret: secret,
          preferredMethod: 'totp',
        },
      },
    },
    depth: 0,
    id: user.id,
  })

  await recordAuditEvent({
    action: 'users.mfa.enroll_requested',
    context: req.context,
    detail: {
      method: 'totp',
    },
    organization: null,
    req,
    targetId: user.id,
    targetType: 'users',
  })

  return {
    manualEntryKey,
    otpauthUri: createOtpAuthUri({
      email: user.email ?? String(user.id),
      secret,
    }),
    secret,
  }
}

export const completeTotpEnrollment = async ({
  req,
  token,
}: {
  req: PayloadRequest
  token: string
}) => {
  const user = await getUserState(req)
  const pendingSecret = user.security?.mfa?.pendingSecret

  if (!pendingSecret) {
    throw new Error('MFA enrollment has not been started.')
  }

  if (!verifyTotpToken({ secret: pendingSecret, token })) {
    throw new Error('Invalid MFA code.')
  }

  const recoveryCodes = generateRecoveryCodes()
  const verifiedAt = new Date().toISOString()
  const api = getSystemApi(req, 'complete mfa enrollment')

  await api.update({
    collection: 'users',
    context: withAuditDisabledContext(req.context),
    data: {
      security: {
        ...(user.security ?? {}),
        mfa: {
          ...(user.security?.mfa ?? {}),
          enabled: true,
          enrolledAt: user.security?.mfa?.enrolledAt ?? verifiedAt,
          pendingSecret: null,
          preferredMethod: 'totp',
          recoveryCodeHashes: recoveryCodes.hashes,
          recoveryCodeVersion: nextRecoveryCodeVersion(user.security?.mfa?.recoveryCodeVersion),
          secret: pendingSecret,
          verifiedAt,
        },
      },
    },
    depth: 0,
    id: user.id,
  })

  await recordAuditEvent({
    action: 'users.mfa.enabled',
    context: req.context,
    detail: {
      method: 'totp',
      recoveryCodeCount: recoveryCodes.codes.length,
    },
    organization: null,
    req,
    targetId: user.id,
    targetType: 'users',
  })

  return {
    recoveryCodes: recoveryCodes.codes,
    verifiedAt,
  }
}

const verifyEnabledMfaChallenge = async ({
  allowRecoveryCode,
  code,
  req,
}: {
  allowRecoveryCode?: boolean
  code: string
  req: PayloadRequest
}) => {
  const user = await getUserState(req)
  const secret = user.security?.mfa?.secret
  const recoveryCodeHashes = user.security?.mfa?.recoveryCodeHashes ?? []

  if (!user.security?.mfa?.enabled || !secret) {
    throw new Error('MFA is not enabled for this account.')
  }

  const normalizedCode = code.trim()
  if (!normalizedCode) {
    throw new Error('MFA code is required.')
  }

  if (verifyTotpToken({ secret, token: normalizedCode })) {
    return {
      method: 'totp' as const,
      user,
    }
  }

  if (allowRecoveryCode) {
    const recovery = verifyRecoveryCode({
      code: normalizedCode,
      hashes: recoveryCodeHashes,
    })

    if (recovery) {
      const api = getSystemApi(req, 'consume recovery code')
      await api.update({
        collection: 'users',
        context: withAuditDisabledContext(req.context),
        data: {
          security: {
            ...(user.security ?? {}),
            mfa: {
              ...(user.security?.mfa ?? {}),
              recoveryCodeHashes: recovery.remainingHashes,
            },
          },
        },
        depth: 0,
        id: user.id,
      })

      await recordAuditEvent({
        action: 'users.mfa.recovery_code_used',
        context: req.context,
        detail: {
          recoveryCodesRemaining: recovery.remainingHashes.length,
        },
        organization: null,
        req,
        targetId: user.id,
        targetType: 'users',
      })

      return {
        method: 'recovery_code' as const,
        user: {
          ...user,
          security: {
            ...(user.security ?? {}),
            mfa: {
              ...(user.security?.mfa ?? {}),
              recoveryCodeHashes: recovery.remainingHashes,
            },
          },
        },
      }
    }
  }

  throw new Error('Invalid MFA code.')
}

export const regenerateRecoveryCodes = async ({
  code,
  req,
}: {
  code: string
  req: PayloadRequest
}) => {
  const challenge = await verifyEnabledMfaChallenge({
    allowRecoveryCode: true,
    code,
    req,
  })
  const nextCodes = generateRecoveryCodes()
  const api = getSystemApi(req, 'regenerate recovery codes')

  await api.update({
    collection: 'users',
    context: withAuditDisabledContext(req.context),
    data: {
      security: {
        ...(challenge.user.security ?? {}),
        mfa: {
          ...(challenge.user.security?.mfa ?? {}),
          recoveryCodeHashes: nextCodes.hashes,
          recoveryCodeVersion: nextRecoveryCodeVersion(challenge.user.security?.mfa?.recoveryCodeVersion),
        },
      },
    },
    depth: 0,
    id: challenge.user.id,
  })

  await recordAuditEvent({
    action: 'users.mfa.recovery_codes_regenerated',
    context: req.context,
    detail: {
      method: challenge.method,
      recoveryCodeCount: nextCodes.codes.length,
    },
    organization: null,
    req,
    targetId: challenge.user.id,
    targetType: 'users',
  })

  return {
    recoveryCodes: nextCodes.codes,
  }
}

export const disableMfa = async ({
  code,
  req,
}: {
  code: string
  req: PayloadRequest
}) => {
  const challenge = await verifyEnabledMfaChallenge({
    allowRecoveryCode: true,
    code,
    req,
  })
  const api = getSystemApi(req, 'disable mfa')

  await api.update({
    collection: 'users',
    context: withAuditDisabledContext(req.context),
    data: {
      security: {
        ...(challenge.user.security ?? {}),
        mfa: {
          ...(challenge.user.security?.mfa ?? {}),
          enabled: false,
          enrolledAt: null,
          pendingSecret: null,
          recoveryCodeHashes: [],
          recoveryCodeVersion: nextRecoveryCodeVersion(challenge.user.security?.mfa?.recoveryCodeVersion),
          secret: null,
          verifiedAt: null,
        },
      },
    },
    depth: 0,
    id: challenge.user.id,
  })

  await recordAuditEvent({
    action: 'users.mfa.disabled',
    context: req.context,
    detail: {
      method: challenge.method,
    },
    organization: null,
    req,
    targetId: challenge.user.id,
    targetType: 'users',
  })

  return {
    disabled: true,
  }
}
