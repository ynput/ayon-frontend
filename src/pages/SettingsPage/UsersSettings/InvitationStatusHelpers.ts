import type { InvitationFields, InvitationState } from './InvitationStatus'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const getInvitationState = (user: InvitationFields): InvitationState => {
  if (user.inviteAcceptedAt) return 'accepted'
  if (!user.inviteSentAt) return 'none'
  const sentMs = new Date(user.inviteSentAt).getTime()
  return Date.now() - sentMs > INVITE_TTL_MS ? 'expired' : 'pending'
}
