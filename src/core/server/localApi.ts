import type { PayloadRequest } from 'payload'

type LocalApiOptions = {
  depth?: number
  reason?: string
  overrideAccess?: boolean
}

type LocalApiArgs = Record<string, unknown> & {
  context?: Record<string, unknown>
  depth?: number
  req?: PayloadRequest
  overrideAccess?: boolean
  user?: PayloadRequest['user']
}

const assertRequestHasPayload = (req: PayloadRequest) => {
  if (!req?.payload) {
    throw new Error('A Payload request is required for core local API helpers.')
  }
}

const assertAuthenticatedUser = (req: PayloadRequest) => {
  if (!req.user) {
    throw new Error('A signed-in user is required for scoped Local API access.')
  }
}

const stripUnsafeLocalApiArgs = <TArgs extends LocalApiArgs>(args: TArgs) => {
  const { depth, overrideAccess: _overrideAccess, req: _req, user: _user, ...rest } = args
  return {
    depth,
    rest,
  }
}

const buildLocalApi = (req: PayloadRequest, options: LocalApiOptions) => {
  assertRequestHasPayload(req)

  if (options.overrideAccess && !options.reason) {
    throw new Error('System Local API access requires a reason so the call site stays explicit.')
  }

  const defaultDepth = options.depth ?? 0

  return {
    create: <TArgs extends LocalApiArgs>(args: TArgs) => {
      const { depth, rest } = stripUnsafeLocalApiArgs(args)
      return (req.payload.create as any)({
        ...(rest as object),
        context: options.overrideAccess
          ? {
              ...((args.context ?? {}) as Record<string, unknown>),
              studio99InternalReason: options.reason,
            }
          : args.context,
        depth: depth ?? defaultDepth,
        overrideAccess: Boolean(options.overrideAccess),
        req,
        user: options.overrideAccess ? undefined : req.user,
      })
    },
    delete: <TArgs extends LocalApiArgs>(args: TArgs) => {
      const { rest } = stripUnsafeLocalApiArgs(args)
      return (req.payload.delete as any)({
        ...(rest as object),
        context: options.overrideAccess
          ? {
              ...((args.context ?? {}) as Record<string, unknown>),
              studio99InternalReason: options.reason,
            }
          : args.context,
        overrideAccess: Boolean(options.overrideAccess),
        req,
        user: options.overrideAccess ? undefined : req.user,
      })
    },
    find: <TArgs extends LocalApiArgs>(args: TArgs) => {
      const { depth, rest } = stripUnsafeLocalApiArgs(args)
      return (req.payload.find as any)({
        ...(rest as object),
        context: options.overrideAccess
          ? {
              ...((args.context ?? {}) as Record<string, unknown>),
              studio99InternalReason: options.reason,
            }
          : args.context,
        depth: depth ?? defaultDepth,
        overrideAccess: Boolean(options.overrideAccess),
        req,
        user: options.overrideAccess ? undefined : req.user,
      })
    },
    findByID: <TArgs extends LocalApiArgs>(args: TArgs) => {
      const { depth, rest } = stripUnsafeLocalApiArgs(args)
      return (req.payload.findByID as any)({
        ...(rest as object),
        context: options.overrideAccess
          ? {
              ...((args.context ?? {}) as Record<string, unknown>),
              studio99InternalReason: options.reason,
            }
          : args.context,
        depth: depth ?? defaultDepth,
        overrideAccess: Boolean(options.overrideAccess),
        req,
        user: options.overrideAccess ? undefined : req.user,
      })
    },
    findGlobal: <TArgs extends LocalApiArgs>(args: TArgs) => {
      const { depth, rest } = stripUnsafeLocalApiArgs(args)
      return (req.payload.findGlobal as any)({
        ...(rest as object),
        context: options.overrideAccess
          ? {
              ...((args.context ?? {}) as Record<string, unknown>),
              studio99InternalReason: options.reason,
            }
          : args.context,
        depth: depth ?? defaultDepth,
        overrideAccess: Boolean(options.overrideAccess),
        req,
        user: options.overrideAccess ? undefined : req.user,
      })
    },
    update: <TArgs extends LocalApiArgs>(args: TArgs) => {
      const { depth, rest } = stripUnsafeLocalApiArgs(args)
      return (req.payload.update as any)({
        ...(rest as object),
        context: options.overrideAccess
          ? {
              ...((args.context ?? {}) as Record<string, unknown>),
              studio99InternalReason: options.reason,
            }
          : args.context,
        depth: depth ?? defaultDepth,
        overrideAccess: Boolean(options.overrideAccess),
        req,
        user: options.overrideAccess ? undefined : req.user,
      })
    },
    updateGlobal: <TArgs extends LocalApiArgs>(args: TArgs) => {
      const { depth, rest } = stripUnsafeLocalApiArgs(args)
      return (req.payload.updateGlobal as any)({
        ...(rest as object),
        context: options.overrideAccess
          ? {
              ...((args.context ?? {}) as Record<string, unknown>),
              studio99InternalReason: options.reason,
            }
          : args.context,
        depth: depth ?? defaultDepth,
        overrideAccess: Boolean(options.overrideAccess),
        req,
        user: options.overrideAccess ? undefined : req.user,
      })
    },
  }
}

export const createScopedLocalApi = (req: PayloadRequest, depth = 0) => {
  assertAuthenticatedUser(req)
  return buildLocalApi(req, { depth, overrideAccess: false })
}

export const createSystemLocalApi = (req: PayloadRequest, reason: string, depth = 0) =>
  buildLocalApi(req, { depth, overrideAccess: true, reason })
