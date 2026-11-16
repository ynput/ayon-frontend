import { formatDistance } from 'date-fns'
import type { InvitationFields, InvitationState } from './InvitationStatus'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const getInvitationState = (user: InvitationFields): InvitationState => {
  if (user.inviteAcceptedAt) return 'accepted'
  if (!user.inviteSentAt) return 'none'
  const sentMs = new Date(user.inviteSentAt).getTime()
  return Date.now() - sentMs > INVITE_TTL_MS ? 'expired' : 'pending'
}

// the status text, without the icon
export const getInvitationText = (user: InvitationFields): string => {
  const state = getInvitationState(user)
  if (state === 'none') return ''
  if (state === 'accepted')
    return `Accepted - ${formatDistance(new Date(user.inviteAcceptedAt!), new Date(), {
      addSuffix: true,
    })}`
  const sentText = formatDistance(new Date(user.inviteSentAt!), new Date(), { addSuffix: true })
  return state === 'expired' ? `Expired - sent ${sentText}` : `Pending - Sent ${sentText}`
}
