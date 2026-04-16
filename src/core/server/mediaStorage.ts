import path from 'node:path'

import { env } from '@/lib/env'

const normalizeFileName = (filename: string) =>
  filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')

export const getMediaRetentionUntil = (retentionDays = env.recovery.mediaRetentionDays) =>
  new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString()

export const buildMediaObjectKey = ({
  filename,
  organizationId,
}: {
  filename: string
  organizationId: number | string
}) => {
  const extension = path.extname(filename)
  const basename = path.basename(filename, extension)
  const safeBase = normalizeFileName(basename || 'asset')
  const safeExtension = normalizeFileName(extension || '')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  return `organization/${organizationId}/${timestamp}-${safeBase}${safeExtension}`
}

export const buildMediaDeliveryPath = (mediaId: number | string) => `/api/core/media/${mediaId}/download`
