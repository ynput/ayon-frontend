import { useState } from 'react'
import { toast } from 'react-toastify'
import { formatDistance } from 'date-fns'
import { Button } from '@ynput/ayon-react-components'
import { useInviteUserMutation } from '@shared/api'
import { InfoMessage } from '@shared/components'
import * as Styled from './DeleteUserDialog.styled'

export type InviteCandidate = {
  name: string
  attrib?: { email?: string; fullName?: string }
  inviteSentAt?: string | null
  inviteAcceptedAt?: string | null
  active?: boolean
}

type Props = {
  isOpen: boolean
  onHide: () => void
  selectedUserList: InviteCandidate[]
}

const InviteUserDialog = ({ isOpen, onHide, selectedUserList }: Props) => {
  const [sending, setSending] = useState(false)
  const [inviteUser] = useInviteUserMutation()

  if (!isOpen) return null

  const invitable = selectedUserList.filter((u) => !!u.attrib?.email && u.active)
  const skipped = selectedUserList.filter((u) => !u.attrib?.email || !u.active)

  const handleSend = async () => {
    setSending(true)
    const results = await Promise.allSettled(
      invitable.map((u) => inviteUser({ userName: u.name, inviteUserRequest: {} }).unwrap()),
    )
    setSending(false)

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.length - succeeded

    if (succeeded) {
      toast.success(`Sent ${succeeded} invite${succeeded === 1 ? '' : 's'}`)
    }
    if (failed) {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          const detail =
            (r as PromiseRejectedResult).reason?.detail ||
            (r as PromiseRejectedResult).reason?.message ||
            'Invite failed'
          toast.error(`${invitable[i].name}: ${detail}`)
        }
      })
      return
    }
    onHide()
  }

  const header = 'Invite users to AYON by email'

  return (
    <Styled.StyledDialog
      size="md"
      header={header}
      footer={
        <Styled.FooterContainer>
          <Styled.FooterActions>
            <Button label="Cancel" onClick={onHide} disabled={sending} />
            <Button
              variant="filled"
              label={
                sending
                  ? 'Sending...'
                  : `Send ${invitable.length} ${invitable.length > 1 ? 'invites' : 'invite'}`
              }
              icon="send"
              onClick={handleSend}
              disabled={sending || invitable.length === 0}
            />
          </Styled.FooterActions>
        </Styled.FooterContainer>
      }
      isOpen={true}
      onClose={onHide}
    >
      {skipped.length > 0 && (
        <InfoMessage
          style={{ marginBottom: 16 }}
          variant="warning"
          message={
            invitable.length === 0
              ? 'None of the selected users are active and have an email.'
              : `${invitable.length} of ${selectedUserList.length} will be invited — ${skipped.length} skipped (no email or inactive).`
          }
        />
      )}

      {invitable.length > 0 && (
        <>
          <Styled.UserList>
            {invitable.map((u) => (
              <div
                key={u.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '2px 0',
                }}
              >
                <span>
                  {u.name}
                  {u.attrib?.email && <span style={{ opacity: 0.6 }}> — {u.attrib.email}</span>}
                </span>
                {u.inviteAcceptedAt ? (
                  <span style={{ opacity: 0.6 }}>
                    Accepted{' '}
                    {formatDistance(new Date(u.inviteAcceptedAt), new Date(), { addSuffix: true })}
                  </span>
                ) : u.inviteSentAt ? (
                  <span style={{ opacity: 0.6 }}>
                    Last invited{' '}
                    {formatDistance(new Date(u.inviteSentAt), new Date(), { addSuffix: true })}
                  </span>
                ) : null}
              </div>
            ))}
          </Styled.UserList>
        </>
      )}

      {skipped.length > 0 && (
        <>
          <Styled.FooterLabel style={{ marginTop: 16 }}>Skipped</Styled.FooterLabel>
          <Styled.UserList>
            {skipped.map((u) => (
              <div key={u.name}>
                {u.name}
                <span style={{ opacity: 0.6 }}>{!u.active ? ' — inactive' : ' — no email'}</span>
              </div>
            ))}
          </Styled.UserList>
        </>
      )}
    </Styled.StyledDialog>
  )
}

export default InviteUserDialog
