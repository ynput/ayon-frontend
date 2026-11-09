// Service users (API-key sessions: services, agents, CI) are admins on the server, but /api/info
// sends neither the admin flag nor their UI exposure level, which hid project pages from them.
// Give the frontend the server's view of them.
export const withServiceUserAccess = <
  T extends { data?: Record<string, unknown>; uiExposureLevel?: number | null },
>(
  user: T,
): T =>
  user?.data?.isService
    ? {
        ...user,
        uiExposureLevel: user.uiExposureLevel ?? 900,
        data: { ...user.data, isAdmin: true, isManager: true },
      }
    : user
