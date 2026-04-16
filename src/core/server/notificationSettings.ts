type NotificationChannels = {
  email?: boolean | null
  inApp?: boolean | null
}

type NotificationCategories = {
  billing?: NotificationChannels | null
  product?: NotificationChannels | null
  security?: NotificationChannels | null
}

type NotificationSubject = {
  notificationDefaults?: NotificationCategories | null
  notificationSettings?: NotificationCategories | null
}

const mergeChannels = (
  base: NotificationChannels | null | undefined,
  override: NotificationChannels | null | undefined,
): NotificationChannels => ({
  email: override?.email ?? base?.email ?? true,
  inApp: override?.inApp ?? base?.inApp ?? true,
})

export const resolveNotificationSettings = ({
  organization,
  user,
}: {
  organization?: { notificationDefaults?: NotificationCategories | null } | null
  user?: { notificationSettings?: NotificationCategories | null } | null
}) => {
  const orgDefaults = organization?.notificationDefaults
  const userOverrides = user?.notificationSettings

  return {
    billing: mergeChannels(orgDefaults?.billing, userOverrides?.billing),
    product: mergeChannels(orgDefaults?.product, userOverrides?.product),
    security: mergeChannels(orgDefaults?.security, userOverrides?.security),
  }
}
