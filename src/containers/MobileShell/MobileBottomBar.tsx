import { ReactNode, useState } from 'react'
import { useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import { UserImage } from '@shared/components'
import { AppMenu, HelpMenu, UserMenu } from '@components/Menu'
import { useGetInboxHasUnreadQuery } from '@queries/inbox/getInbox'
import { useAppSelector } from '@state/store'
import * as Styled from './MobileShell.styled'
import { SHEET_MASK_STYLE } from './MobileShellHelpers'

const MobileInboxItem = ({ isActive }: { isActive: boolean }) => {
  const { data: hasUnread } = useGetInboxHasUnreadQuery({})

  return (
    <Styled.BarLink to="/inbox/important" className={clsx({ active: isActive })}>
      <Styled.IconWithDot $dot={!!hasUnread}>
        <Icon icon="inbox" filled={isActive} />
      </Styled.IconWithDot>
      <span>Inbox</span>
    </Styled.BarLink>
  )
}

type Props = {
  children: ReactNode
}

const MobileBottomBar = ({ children }: Props) => {
  const { pathname } = useLocation()
  const user = useAppSelector((state) => state.user)
  const avatarKey = useAppSelector((state) => state.user.avatarKey)
  const [isUserOpen, setIsUserOpen] = useState(false)
  const closeUser = () => setIsUserOpen(false)
  const isGuest = !!user.data?.isGuest

  return (
    <Styled.Bar aria-label="Navigation">
      {children}
      {!isGuest && <MobileInboxItem isActive={pathname.startsWith('/inbox')} />}
      <Styled.BarButton
        type="button"
        aria-label="User menu"
        className={clsx({ active: isUserOpen })}
        onClick={() => setIsUserOpen(true)}
      >
        <UserImage size={24} name={user.name} imageKey={avatarKey} />
        <span>{user.attrib?.fullName || user.name}</span>
      </Styled.BarButton>
      <Styled.Sheet
        position="bottom"
        visible={isUserOpen}
        onHide={closeUser}
        showCloseIcon={false}
        blockScroll
        maskStyle={SHEET_MASK_STYLE}
      >
        <Styled.SheetSection>
          <UserMenu user={user} onClose={closeUser} />
        </Styled.SheetSection>
        {!isGuest && (
          <>
            <Styled.SheetSection>
              <AppMenu user={user} onClose={closeUser} />
            </Styled.SheetSection>
            <Styled.SheetSection>
              <HelpMenu user={user} onClose={closeUser} />
            </Styled.SheetSection>
          </>
        )}
      </Styled.Sheet>
    </Styled.Bar>
  )
}

export default MobileBottomBar
