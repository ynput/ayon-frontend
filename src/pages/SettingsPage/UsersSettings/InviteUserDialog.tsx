import { useState } from 'react'
import { toast } from 'react-toastify'
import { formatDistance } from 'date-fns'
import { Button } from '@ynput/ayon-react-components'
import { useInviteUserMutation } from '@shared/api'
import InfoMessage from '@components/InfoMessage'
import * as Styled from './DeleteUserDialog.styled'

export type InviteCandidate = {
  name: string
  attrib?: { email?: string; fullName?: string }
  inviteSent?: string | null
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

  const invitable = selectedUserList.filter((u) => !!u.attrib?.email)
  const skipped = selectedUserList.filter((u) => !u.attrib?.email)

  const handleSend = async () => {
    setSending(true)
    const results = await Promise.allSettled(
      invitable.map((u) =>
        inviteUser({ userName: u.name, inviteUserRequest: {} }).unwrap(),
      ),
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

  const headerCount = invitable.length || selectedUserList.length
  const header =
    headerCount === 1
      ? `Invite ${(invitable[0] ?? selectedUserList[0]).name}`
      : `Invite ${invitable.length} of ${selectedUserList.length} users`

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
              label={sending ? 'Sending...' : 'Send invite'}
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
              ? 'None of the selected users have an email. Nothing to send.'
              : `${invitable.length} of ${selectedUserList.length} will be invited — ${skipped.length} have no email.`
          }
        />
      )}

      {invitable.length > 0 && (
        <>
          <Styled.FooterLabel>Will be invited</Styled.FooterLabel>
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
                  {u.attrib?.email && (
                    <span style={{ opacity: 0.6 }}> — {u.attrib.email}</span>
                  )}
                </span>
                {u.inviteSent && (
                  <span style={{ opacity: 0.6 }}>
                    Last invited{' '}
                    {formatDistance(new Date(u.inviteSent), new Date(), { addSuffix: true })}
                  </span>
                )}
              </div>
            ))}
          </Styled.UserList>
        </>
      )}

      {skipped.length > 0 && (
        <>
          <Styled.FooterLabel style={{ marginTop: 16 }}>Skipped (no email)</Styled.FooterLabel>
          <Styled.UserList>
            {skipped.map((u) => (
              <div key={u.name}>{u.name}</div>
            ))}
          </Styled.UserList>
        </>
      )}
    </Styled.StyledDialog>
  )
}

export default InviteUserDialog
