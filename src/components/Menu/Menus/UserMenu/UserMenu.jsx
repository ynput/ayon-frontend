import React from 'react'
import * as Styled from './UserMenu.styled'
import { Button, UserImage } from '@ynput/ayon-react-components'
import Font from '/src/theme/typography.module.css'
import { useLogOutMutation } from '/src/services/auth/getAuth'
import { NavLink } from 'react-router-dom'

export const UserMenu = ({ user, onClose }) => {
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
              <NavLink to="/profile">
                <span className={'error'}>Set Full Name</span>
              </NavLink>
            )}
          </Styled.Details>
        </Styled.Header>
        <Styled.Buttons>
          <NavLink to="/profile">
            <Button variant="surface" icon="manage_accounts" label="Edit" />
          </NavLink>
          <Button icon="logout" label="Sign out" onClick={handleLogOut} className="close" />
        </Styled.Buttons>
      </Styled.Content>
      {footer && <Styled.Footer>{footer}</Styled.Footer>}
    </Styled.UserMenu>
  )
}

export default UserMenu
