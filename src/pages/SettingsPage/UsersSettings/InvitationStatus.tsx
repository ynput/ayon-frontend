import { FC } from 'react'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'
import { getInvitationState, getInvitationText } from './InvitationStatusHelpers'

export type InvitationState = 'none' | 'pending' | 'accepted' | 'expired'

export type InvitationFields = {
  inviteSentAt?: string | null
  inviteAcceptedAt?: string | null
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

  const icon = state === 'accepted' ? 'check_circle' : state === 'expired' ? 'cancel' : 'hourglass'
  return (
    <Pill $state={state} $plain={plain}>
      <Icon icon={icon} />
      {getInvitationText(user)}
    </Pill>
  )
}

export default InvitationStatus
