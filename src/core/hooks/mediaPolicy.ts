import type { CollectionBeforeChangeHook } from 'payload'

import {
  buildMediaDeliveryPath,
  getMediaRetentionUntil,
  buildMediaObjectKey,
} from '../server/mediaStorage'
import { resolveDocumentId } from '../utils/ids'

type MediaMutation = {
  deletedAt?: null | string
  deliveryUrl?: null | string
  filename?: null | string
  id: number | string
  objectKey?: null | string
  organization?: null | number | string | { id?: null | number | string }
  retentionState?: null | string
  retentionUntil?: null | string
  visibility?: null | string
}

export const applyMediaStoragePolicy: CollectionBeforeChangeHook<MediaMutation> = ({
  data,
  originalDoc,
  req,
}) => {
  const nextData = { ...data }
  const organizationId =
    resolveDocumentId(nextData.organization) ?? resolveDocumentId(originalDoc?.organization)
  const incomingFilename =
    nextData.filename ??
    (((req as unknown as { file?: { name?: string } }).file?.name as string | undefined) ?? null) ??
    originalDoc?.filename ??
    null

  if (!nextData.visibility) {
    nextData.visibility = originalDoc?.visibility ?? 'private'
  }

  if (organizationId !== null && incomingFilename && !nextData.objectKey) {
    nextData.objectKey = buildMediaObjectKey({
      filename: incomingFilename,
      organizationId,
    })
  }

  if (originalDoc?.id || nextData.objectKey) {
    nextData.deliveryUrl = buildMediaDeliveryPath(
      resolveDocumentId(originalDoc?.id ?? null) ?? nextData.id ?? nextData.objectKey ?? 'pending',
    )
  }

  if (nextData.deletedAt && !nextData.retentionUntil) {
    nextData.retentionUntil = getMediaRetentionUntil()
    nextData.retentionState = 'scheduled_for_purge'
  }

  if (!nextData.deletedAt && originalDoc?.deletedAt) {
    nextData.retentionState = 'active'
    nextData.retentionUntil = null
  }

  if (!nextData.retentionState) {
    nextData.retentionState = originalDoc?.retentionState ?? 'active'
  }

  return nextData
}
