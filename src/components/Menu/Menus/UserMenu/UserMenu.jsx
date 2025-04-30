import UserMenuHeader from './UserMenuHeader'
import Menu from '../../MenuComponents/Menu'
import { useLogOutMutation } from '@queries/auth/logout'

export const UserMenu = ({ user, ...props }) => {
  const fullName = user?.attrib?.fullName
  // const isUser = user?.data?.isUser

  // sign out
  const [logout] = useLogOutMutation()

  const handleLogOut = () => {
    // onClose && onClose()
    logout()
  }

  const items = [
    {
      id: 'account',
      link: '/account/profile',
      label: 'Account',
      icon: 'person',
    },
    // {
    //   id: 'settings',
    //   link: '/account/settings',
    //   label: 'Settings',
    //   icon: 'settings',
    // },
    {
      id: 'downloads',
      link: '/account/downloads',
      label: 'Download Launcher',
      icon: 'install_desktop',
    },
    {
      id: 'divider',
    },
    {
      id: 'signOut',
      label: 'Sign out',
      icon: 'logout',
      onClick: handleLogOut,
    },
  ]

  return (
    <>
      <Menu menu={items} header={<UserMenuHeader user={user} fullName={fullName} />} {...props} />
    </>
  )
}

export default UserMenu
