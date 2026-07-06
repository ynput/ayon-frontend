import { FC } from 'react'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'
import { formatDistance } from 'date-fns'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type InvitationState = 'none' | 'pending' | 'accepted' | 'expired'

type InvitationFields = {
  inviteSentAt?: string | null
  inviteAcceptedAt?: string | null
}

export const getInvitationState = (user: InvitationFields): InvitationState => {
  if (user.inviteAcceptedAt) return 'accepted'
  if (!user.inviteSentAt) return 'none'
  const sentMs = new Date(user.inviteSentAt).getTime()
  return Date.now() - sentMs > INVITE_TTL_MS ? 'expired' : 'pending'
}

const Pill = styled.span<{ $state: Exclude<InvitationState, 'none'>; $plain?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: var(--base-gap-small);
  font-size: 0.9rem;
  white-space: nowrap;

  ${({ $plain, $state }) =>
    $plain
      ? `
        .icon {
          ${
            $state === 'pending'
              ? 'color: var(--md-sys-color-primary);'
              : $state === 'accepted'
                ? 'color: var(--md-sys-color-tertiary);'
                : 'color: var(--md-sys-color-warning);'
          }
        }
      `
      : `
        height: 32px;
        padding: 0 8px;
        border-radius: var(--border-radius-m);
        .icon { color: inherit; }
        ${
          $state === 'pending'
            ? `
              background-color: var(--md-sys-color-primary-container);
              color: var(--md-sys-color-on-primary-container);
            `
            : $state === 'accepted'
              ? `
                background-color: var(--md-sys-color-tertiary-container);
                color: var(--md-sys-color-on-tertiary-container);
              `
              : `
                background-color: var(--md-sys-color-warning-container);
                color: var(--md-sys-color-on-warning-container);
              `
        }
      `}
`

interface InvitationStatusProps {
  user: InvitationFields
  plain?: boolean
}

export const InvitationStatus: FC<InvitationStatusProps> = ({ user, plain }) => {
  const state = getInvitationState(user)
  if (state === 'none') return null

  if (state === 'accepted') {
    return (
      <Pill $state="accepted" $plain={plain}>
        <Icon icon="check_circle" />
        {`Accepted - ${formatDistance(new Date(user.inviteAcceptedAt!), new Date(), { addSuffix: true })}`}
      </Pill>
    )
  }

  const sent = new Date(user.inviteSentAt!)
  const sentText = formatDistance(sent, new Date(), { addSuffix: true })

  if (state === 'expired') {
    return (
      <Pill $state="expired" $plain={plain}>
        <Icon icon="cancel" />
        {`Expired - sent ${sentText}`}
      </Pill>
    )
  }

  return (
    <Pill $state="pending" $plain={plain}>
      <Icon icon="hourglass" />
      {`Pending - Sent ${sentText}`}
    </Pill>
  )
}

export default InvitationStatus
