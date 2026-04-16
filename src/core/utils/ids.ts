export type RelationshipValue =
  | number
  | string
  | {
      id?: number | string | null
    }
  | null
  | undefined

export const resolveDocumentId = (value: RelationshipValue): number | string | null => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && 'id' in value) {
    return resolveDocumentId(value.id)
  }

  return null
}

export const documentIdKey = (value: RelationshipValue): string | null => {
  const resolved = resolveDocumentId(value)

  if (resolved === null) {
    return null
  }

  return String(resolved)
}

export const compactDocumentIds = (values: RelationshipValue[]): Array<number | string> => {
  const seen = new Set<string>()
  const ids: Array<number | string> = []

  for (const value of values) {
    const resolved = resolveDocumentId(value)
    if (resolved === null) {
      continue
    }

    const key = String(resolved)
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    ids.push(resolved)
  }

  return ids
}
