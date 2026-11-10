import { useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import { useIsMobile } from '@hooks/useIsMobile'
import MobileBottomBar from './MobileBottomBar'
import * as Styled from './MobileShell.styled'
import { PROJECT_PATH_PREFIX } from './MobileShellHelpers'

const MobileAppBar = () => {
  const isMobile = useIsMobile()
  const { pathname } = useLocation()

  if (!isMobile || pathname.startsWith(PROJECT_PATH_PREFIX)) return null

  const isHome = pathname.startsWith('/dashboard')

  return (
    <MobileBottomBar>
      <Styled.BarLink to="/dashboard/tasks" className={clsx({ active: isHome })}>
        <Icon icon="home" filled={isHome} />
        <span>Home</span>
      </Styled.BarLink>
    </MobileBottomBar>
  )
}

export default MobileAppBar
