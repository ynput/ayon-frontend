import * as Styled from './UserMenu.styled'
import UserImage from '@shared/components/UserImage'
import Font from '@/theme/typography.module.css'
import { NavLink } from 'react-router-dom'

const UserMenuHeader = ({ user, fullName }) => {
  return (
    <Styled.Header>
      <UserImage size={30} name={user?.name} />
      <Styled.Details className={Font.titleSmall}>
        <span>{user?.name}</span>
        {fullName ? (
          <span>{fullName}</span>
        ) : (
          <NavLink to="/account/profile">
            <span className={'error'}>Set Full Name</span>
          </NavLink>
        )}
      </Styled.Details>
    </Styled.Header>
  )
}

export default UserMenuHeader
