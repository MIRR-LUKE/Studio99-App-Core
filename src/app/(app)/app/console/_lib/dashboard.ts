import type { PayloadRequest } from 'payload'

import { resolveOrganizationBillingSummary } from '@/core/billing/helpers'
import { getCurrentOrganizationState } from '@/core/server/currentOrganization'
import { createAuthenticatedServerComponentRequest } from '@/core/server/serverComponentPayload'
import { createScopedLocalApi } from '@/core/server/localApi'
import { consoleProject, consoleProjectCollectionSummaries } from '@/projects/console'

type ConsoleDashboardCount = {
  collection: string
  count: number
}

const countDocs = async (
  api: ReturnType<typeof createScopedLocalApi>,
  collection: string,
): Promise<ConsoleDashboardCount> => {
  try {
    const result = await api.find({
      collection,
      depth: 0,
      limit: 1,
    })

    return { collection, count: result.totalDocs }
  } catch {
    return { collection, count: 0 }
  }
}

export type ConsoleProjectDashboard = {
  billing: Awaited<ReturnType<typeof resolveOrganizationBillingSummary>>
  collectionCounts: ConsoleDashboardCount[]
  currentOrganizationName: string
  currentOrganizationStatus: string
  currentOrganizationSummary: string
  membershipsCount: number
  project: typeof consoleProject
  projectCollectionSummaries: typeof consoleProjectCollectionSummaries
  projectRoute: string
  ready: true
} | {
  errorMessage: string
  ready: false
}

export const loadConsoleProjectDashboard = async (): Promise<ConsoleProjectDashboard> => {
  try {
    const { req } = await createAuthenticatedServerComponentRequest('/app/console')

    if (!req.user) {
      return {
        errorMessage: 'サインイン後にもう一度開いてください。',
        ready: false,
      }
    }

    const api = createScopedLocalApi(req)
    const currentOrganizationState = await getCurrentOrganizationState(req)
    const currentOrganization = currentOrganizationState.currentOrganization
    const currentOrganizationName =
      typeof currentOrganization === 'object' && currentOrganization !== null && 'name' in currentOrganization
        ? String((currentOrganization as { name?: unknown }).name ?? '未選択')
        : '未選択'
    const currentOrganizationStatus =
      typeof currentOrganization === 'object' && currentOrganization !== null && 'status' in currentOrganization
        ? String((currentOrganization as { status?: unknown }).status ?? 'unknown')
        : 'unknown'
    const currentOrganizationSummary =
      typeof currentOrganization === 'object' && currentOrganization !== null && 'name' in currentOrganization
        ? `${String((currentOrganization as { name?: unknown }).name ?? 'organization')} / ${currentOrganizationState.currentOrganizationId ?? 'unknown'}`
        : 'まだ current organization がありません。'
    const [collectionCounts, billing] = await Promise.all([
      Promise.all(consoleProjectCollectionSummaries.map((collection) => countDocs(api, collection.slug))),
      resolveOrganizationBillingSummary({
        organizationId: currentOrganizationState.currentOrganizationId,
        req,
      }).catch(() => ({
        accessEnabled: false,
        billingHealthy: false,
        billingStatus: 'none',
        entitlements: {},
        gracePeriodEndsAt: null,
        organizationId: currentOrganizationState.currentOrganizationId ?? 'unknown',
        planKey: consoleProject.billing.planKey,
        recoveryStatus: 'unhealthy' as const,
        seatLimit: 0,
        seatRemaining: null,
        seatsInUse: 0,
        subscriptionQuantity: 0,
        usageState: {},
      })),
    ])

    return {
      billing,
      collectionCounts,
      currentOrganizationName,
      currentOrganizationStatus,
      currentOrganizationSummary,
      membershipsCount: currentOrganizationState.memberships.length,
      project: consoleProject,
      projectCollectionSummaries: consoleProjectCollectionSummaries,
      projectRoute: '/app/console',
      ready: true,
    }
  } catch (error) {
    return {
      errorMessage: error instanceof Error ? error.message : 'console project dashboard の読み込みに失敗しました。',
      ready: false,
    }
  }
}
