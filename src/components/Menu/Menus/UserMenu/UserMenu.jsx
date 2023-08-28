import React from 'react'
import * as Styled from './UserMenu.styled'
import { Button, UserImage } from '@ynput/ayon-react-components'
import Font from '/src/theme/typography.module.css'
import { useLogOutMutation } from '/src/services/auth/getAuth'

export const UserMenu = ({ user, onClose, navigate }) => {
  const [logout] = useLogOutMutation()

  const handleLogOut = () => {
    onClose && onClose()
    logout()
  }

  const footer = ''
  const fullName = user?.attrib?.fullName

  return (
    <Styled.UserMenu>
      <Styled.Content>
        <Styled.Header>
          <UserImage size={40} src={user?.attrib?.avatarUrl} fullName={fullName || user?.name} />
          <Styled.Details className={Font.titleSmall}>
            <span>{user?.name}</span>
            {fullName ? (
              <span>{fullName}</span>
            ) : (
              <span onClick={() => navigate('/profile')} className={'error'}>
                Set Full Name
              </span>
            )}
          </Styled.Details>
        </Styled.Header>
        <Styled.Buttons>
          <Button
            variant="surface"
            icon="manage_accounts"
            label="Edit"
            onClick={() => navigate('/profile')}
          />
          <Button
            variant="tonal"
            icon="logout"
            label="Sign out"
            onClick={handleLogOut}
            className="close"
          />
        </Styled.Buttons>
      </Styled.Content>
      {footer && <Styled.Footer>{footer}</Styled.Footer>}
    </Styled.UserMenu>
  )
}

export default UserMenu
