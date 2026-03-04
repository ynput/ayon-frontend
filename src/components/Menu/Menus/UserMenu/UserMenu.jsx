import UserMenuHeader from './UserMenuHeader'
import { Menu } from '@shared/components'
import { useLogoutMutation } from '@queries/auth/logout'

export const UserMenu = ({ user, ...props }) => {
  const fullName = user?.attrib?.fullName
  // const isUser = user?.data?.isUser

  // sign out
  const [logout] = useLogoutMutation()

  const handleLogOut = () => {
    // onClose && onClose()
    logout()
  }

  const items = []
  if (!user.data.isGuest) {
    items.push({
      id: 'account',
      link: '/account/profile',
      label: 'Account',
      icon: 'person',
    })
    items.push({
      id: 'downloads',
      link: '/account/downloads',
      label: 'Download Launcher',
      icon: 'install_desktop',
    })
    items.push({ id: 'divider' })
  }

  items.push({
    id: 'signOut',
    label: 'Sign out',
    icon: 'logout',
    onClick: handleLogOut,
  })

  return (
    <>
      <Menu menu={items} header={<UserMenuHeader user={user} fullName={fullName} />} {...props} />
    </>
  )
}

export default UserMenu
