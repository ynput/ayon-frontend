import { FC, useEffect, useState } from 'react'
import { Button, Dialog, InputText, SaveButton, theme, Toolbar } from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'
import { useUpdateUserMutation } from '@shared/api'
import { updateUserAttribs } from '@state/user'
import { useAppDispatch, useAppSelector } from '@state/store'
import { useLocation } from 'react-router-dom'
import Avatar from '@components/Avatar/Avatar'
import styled from 'styled-components'

interface CompleteProfilePromptProps {}

const LOCAL_STORAGE_KEY = 'ayon-email-prompt-dismissed'

const AvatarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`

const StyledDialog = styled(Dialog)`
  max-height: unset;
  border-radius: 16px;

  .header {
    ${theme.titleLarge}
    padding-bottom: 0
  }
`

const StyledRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const CompleteProfilePrompt: FC<CompleteProfilePromptProps> = () => {
  const user = useAppSelector((state) => state.user)
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const dispatch = useAppDispatch()
  const location = useLocation()

  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation()

  useEffect(() => {
    if (!user?.name) return

    // Check if user has email
    const hasEmail = user.attrib?.email && user.attrib.email.trim() !== ''

    // Initialize fullName from user data if available
    if (user.attrib?.fullName) {
      setFullName(user.attrib.fullName)
    }

    // Check if user has dismissed this dialog
    const isDismissed = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true'

    // Only show on dashboard paths
    const isDashboardPath = location.pathname.startsWith('/dashboard')

    // Show dialog if no email and not dismissed and on dashboard path
    if (!hasEmail && !isDismissed && isDashboardPath) {
      setIsOpen(true)
    } else if (isOpen && !isDashboardPath) {
      // Close dialog if we navigate away from dashboard
      setIsOpen(false)
    }
  }, [user, location.pathname, isOpen])

  const handleSave = async () => {
    if (!user) return

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      await updateUser({
        name: user.name,
        patch: {
          attrib: {
            email: email.trim(),
            fullName: fullName.trim() || undefined,
          },
        },
      }).unwrap()

      // Update Redux state
      dispatch(
        updateUserAttribs({
          email: email.trim(),
          fullName: fullName.trim() || undefined,
        }),
      )
      // remove dismissed flag from localStorage
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      toast.success('Profile saved successfully')
      setIsOpen(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to save profile information')
    }
  }

  const handleDismiss = () => {
    // Set dismissed flag in localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <StyledDialog
      onClose={() => {}}
      header="Complete your profile"
      hideCancelButton
      footer={
        <Toolbar>
          <Button label="Later" onClick={handleDismiss} variant="text" />
          <SaveButton
            label="Save profile"
            active={!!email}
            saving={isUpdatingUser}
            onClick={handleSave}
          />
        </Toolbar>
      }
      size="sm"
      isOpen={isOpen}
    >
      <AvatarContainer>
        {user && <Avatar user={user} />}
        <span
          className="avatar-label"
          style={{ fontSize: '12px', color: 'var(--text-color-secondary)', marginTop: '8px' }}
        >
          Upload a profile picture
        </span>
      </AvatarContainer>

      <form
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
      >
        <StyledRow>
          <label htmlFor="fullName">Full name</label>
          <InputText
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            style={{ width: '100%' }}
            autoFocus={!fullName}
          />
        </StyledRow>
        <StyledRow>
          <label htmlFor="email">Email address</label>
          <InputText
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
            placeholder="Email address"
            style={{ width: '100%' }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus={!!fullName}
            type="email"
          />
        </StyledRow>
      </form>
    </StyledDialog>
  )
}

export default CompleteProfilePrompt
