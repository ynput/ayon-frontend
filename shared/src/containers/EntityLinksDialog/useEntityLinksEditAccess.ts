import { useGlobalContext } from '@shared/context/GlobalContext'

// Editing links from the links dialog is part of the AYON Studio subscription.
// Everyone else gets the read-only dialog with a hint about Studio.
//
// For local development the check can be bypassed with
//   localStorage.setItem('entityLinksDialog.edit', 'true')

const devOverride = () => {
  if (!import.meta.env.DEV) return false
  try {
    return localStorage.getItem('entityLinksDialog.edit') === 'true'
  } catch {
    return false
  }
}

export type EntityLinksEditAccess = {
  canEdit: boolean
  /** why editing is not available, shown in the dialog */
  reason?: 'guest' | 'subscription'
}

export const useEntityLinksEditAccess = (): EntityLinksEditAccess => {
  const { user, cloudInfo } = useGlobalContext()

  if (user?.data?.isGuest) return { canEdit: false, reason: 'guest' }
  if (devOverride()) return { canEdit: true }

  const now = Date.now()
  const hasStudio = !!cloudInfo?.subscriptions?.some(
    (s) =>
      s.productType === 'ayon' &&
      /studio/i.test(s.name) &&
      // an ended trial no longer counts
      (!s.trialEnd || new Date(s.trialEnd).getTime() > now),
  )
  return hasStudio ? { canEdit: true } : { canEdit: false, reason: 'subscription' }
}
