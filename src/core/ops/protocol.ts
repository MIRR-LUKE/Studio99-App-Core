export const requireDangerousActionReason = (body: {
  confirm?: boolean
  reason?: string
}) => {
  if (!body.confirm) {
    throw new Error('Dangerous actions require explicit confirmation.')
  }

  if (!body.reason || body.reason.trim().length < 8) {
    throw new Error('Dangerous actions require a meaningful reason of at least 8 characters.')
  }

  return body.reason.trim()
}
