import { useEffect, useMemo, useRef } from 'react'
import type { MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Dropdown } from '@ynput/ayon-react-components'
import { UserImage } from '@shared/components'
import { useUpdateUserMutation } from '@shared/api'

import Breadcrumbs from '../Breadcrumbs/Breadcrumbs'
import HeaderButton from './HeaderButton'
import AppMenu from '@components/Menu/Menus/AppMenu'
import ProjectMenu from '../ProjectMenu/projectMenu'
import { useAppDispatch, useAppSelector } from '@state/store'
import InstallerDownloadPrompt from '@components/InstallerDownload/InstallerDownloadPrompt'
import { useMenuContext } from '@shared/context/MenuContext'
import { HelpMenu, UserMenu } from '@components/Menu'
import { MenuContainer } from '@shared/components'
import { toast } from 'react-toastify'
import { updateUserPreferences } from '@state/user'
import styled from 'styled-components'
import { useRestart } from '@context/RestartContext'
import clsx from 'clsx'
import InboxNotificationIcon from './InboxNotification'
import ReleaseInstallerPrompt from '@containers/ReleaseInstallerDialog/ReleaseInstallerPrompt/ReleaseInstallerPrompt'
import ChatBubbleButton from './ChatBubbleButton'
import { FrontendBundleMode, getFrontendBundleMode } from '@shared/util'

const FlexWrapper = styled.div`
  display: flex;
  gap: var(--base-gap-small);
`

const FlexWrapperEnd = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  justify-content: end;
`

interface BundleModeOption {
  value: FrontendBundleMode
  label: string
}

const FRONTEND_BUNDLE_MODE_LABELS: Record<FrontendBundleMode, string> = {
  production: 'Production',
  staging: 'Staging',
  developer: 'Developer mode',
}

const getBundleModeTextColor = (frontendBundleMode: FrontendBundleMode) => {
  if (frontendBundleMode === 'staging') return 'black'
  if (frontendBundleMode === 'developer') return 'var(--color-hl-developer)'
  return 'var(--md-sys-color-on-surface)'
}

const getBundleModeBackgroundColor = (frontendBundleMode: FrontendBundleMode) => {
  if (frontendBundleMode === 'staging') return 'var(--color-hl-staging)'
  if (frontendBundleMode === 'developer') return 'var(--color-hl-developer-container)'
  return 'var(--md-sys-color-surface-container-highest)'
}

const getBundleModeHoverBackgroundColor = (frontendBundleMode: FrontendBundleMode) => {
  if (frontendBundleMode === 'staging') return 'var(--color-hl-staging-hover)'
  if (frontendBundleMode === 'developer') return 'var(--color-hl-developer-container-hover)'
  return 'var(--md-sys-color-surface-container-highest-hover)'
}

const FrontendBundleModeDropdown = styled(Dropdown)<{ $mode: FrontendBundleMode }>`
  height: 36px;
  min-width: 180px;
  margin: 4px 0;
  z-index: 10;

  button {
    background-color: ${({ $mode }) => getBundleModeBackgroundColor($mode)};
    color: ${({ $mode }) => getBundleModeTextColor($mode)};
    border: none;
    border-radius: var(--border-radius-l);
    padding: 4px 8px;
    min-height: 36px;
    transition: background-color 0.2s;

    &:hover {
      background-color: ${({ $mode }) => getBundleModeHoverBackgroundColor($mode)};
    }

    .template-value {
      border: none;
      background: transparent;
      padding: 0;
    }
  }
`

const FrontendBundleModeValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--base-gap-small);
  min-width: 0;
`

const FrontendBundleModeLabel = styled.span`
  user-select: none;
  white-space: nowrap;
`

const FrontendBundleModeBadge = styled.span<{ $mode: FrontendBundleMode }>`
  border-radius: 999px;
  padding: 2px 6px;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  color: ${({ $mode }) => ($mode === 'developer' ? 'var(--color-hl-developer)' : 'black')};
  background-color: ${({ $mode }) =>
    $mode === 'staging'
      ? 'var(--color-hl-staging)'
      : $mode === 'developer'
        ? 'var(--color-hl-developer-container-hover)'
        : 'var(--color-hl-production)'};
`

const FrontendBundleModeOptionRow = styled.div<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--base-gap-small);
  padding: 4px 8px;
  flex: 1;

  ${({ $isActive }) =>
    $isActive &&
    `
      background-color: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    `}
`

const ProjectsButton = styled(HeaderButton)`
  align-items: center;
  display: flex;
`

const UserButton = styled(HeaderButton)`
  padding: 6px;
`

const Header: React.FC = () => {
  const dispatch = useAppDispatch()
  const { menuOpen, toggleMenuOpen, setMenuOpen } = useMenuContext()
  const handleToggleMenu = (menu: string | false) => toggleMenuOpen(menu)
  const handleSetMenu = (menu: string | false) => setMenuOpen(menu)
  const location = useLocation()
  const navigate = useNavigate()
  // get user from redux store
  const user = useAppSelector((state) => state.user)
  const avatarKey = useAppSelector((state) => state.user.avatarKey)

  // restart server notification
  const { isSnoozing } = useRestart()

  // Get developer states
  const isDeveloper = (user?.data as any)?.isDeveloper
  const frontendBundleMode = getFrontendBundleMode(user)

  // BUTTON REFS used to attach menu to buttons
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)
  const appButtonRef = useRef<HTMLButtonElement>(null)

  // if last path in pathname is 'appMenu' then open appMenu
  useEffect(() => {
    if (location.pathname.split('/').pop() === 'appMenu') {
      // parse query params from current URL
      const searchParams = new URLSearchParams(location.search)

      // set localStorage to true
      localStorage.setItem('appMenuOpen', 'true')
      // then remove 'appMenu' from pathname
      const newPathname = location.pathname.replace('/appMenu', '')

      // append query params to new URL
      const newUrl = `${newPathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      navigate(newUrl, { replace: true })
    } else if (localStorage.getItem('appMenuOpen') === 'true') {
      handleSetMenu('app')
      // delete
      localStorage.removeItem('appMenuOpen')
    }
  }, [location.pathname, localStorage])

  const handleNavClick = (e: MouseEvent<HTMLElement>) => {
    // if target us nav, then close menu
    if ((e.target as HTMLElement).tagName === 'NAV') handleSetMenu(false)
  }

  // UPDATE USER DATA
  const [updateUser] = useUpdateUserMutation()
  const frontendBundleModeOptions = useMemo<BundleModeOption[]>(
    () =>
      (isDeveloper
        ? ['production', 'staging', 'developer']
        : ['production', 'staging']
      ).map((value) => ({
        value: value as FrontendBundleMode,
        label: FRONTEND_BUNDLE_MODE_LABELS[value as FrontendBundleMode],
      })),
    [isDeveloper],
  )

  const renderFrontendBundleMode = (
    frontendBundleModeValue?: FrontendBundleMode,
    isActive?: boolean,
  ) => {
    const mode = frontendBundleModeValue || frontendBundleMode

    return (
      <FrontendBundleModeOptionRow $isActive={isActive}>
        <FrontendBundleModeLabel>{FRONTEND_BUNDLE_MODE_LABELS[mode]}</FrontendBundleModeLabel>
        {mode !== 'production' && (
          <FrontendBundleModeBadge $mode={mode}>
            {mode === 'staging' ? 'Staging' : 'Dev'}
          </FrontendBundleModeBadge>
        )}
      </FrontendBundleModeOptionRow>
    )
  }

  const handleBundleModeChange = async (value: string[]) => {
    try {
      const newFrontendBundleMode =
        value?.[0] === 'staging' ? 'staging' : value?.[0] === 'developer' && isDeveloper ? 'developer' : 'production'
      if (newFrontendBundleMode === frontendBundleMode) return

      const updatedFrontendPreferences = {
        ...(user.data?.frontendPreferences || {}),
        frontendBundleMode: newFrontendBundleMode,
      }

      dispatch(updateUserPreferences({ frontendBundleMode: newFrontendBundleMode }))

      await updateUser({
        name: user.name,
        patch: {
          attrib: { developerMode: newFrontendBundleMode === 'developer' },
          data: {
            ...user.data,
            frontendPreferences: updatedFrontendPreferences,
          },
        },
      }).unwrap()

    } catch (error) {
      console.error(error)
      const errorMessage = (error as any)?.details || 'Unknown error'
      toast.error('Unable to update frontend bundle mode: ' + errorMessage)
      dispatch(updateUserPreferences({ frontendBundleMode }))
    }
  }

  // if on certain page, hide
  const hiddenOnPages = ['/review']
  if (hiddenOnPages.includes(location.pathname)) return null

  return (
    <nav className="primary" onClick={handleNavClick}>
      <FlexWrapper>
        <Link to={'/dashboard/tasks'}>
          <HeaderButton
            icon="home"
            label="Home"
            variant="nav"
            className={clsx({ selected: location.pathname.startsWith('/dashboard') })}
            id="home-button"
          />
        </Link>

        {user.uiExposureLevel >= 500 && (
          <ProjectsButton
            icon="event_list"
            label="Projects"
            variant="nav"
            onClick={() => handleToggleMenu('project')}
          />
        )}

        <ProjectMenu isOpen={menuOpen === 'project'} onHide={() => handleSetMenu(false)} />
      </FlexWrapper>

      <Breadcrumbs />
      <FlexWrapperEnd id="header-menu-right">
        <InstallerDownloadPrompt />
        <ReleaseInstallerPrompt isAdmin={user.data.isAdmin} />
        <FrontendBundleModeDropdown
          $mode={frontendBundleMode}
          value={[frontendBundleMode]}
          options={frontendBundleModeOptions}
          onChange={handleBundleModeChange}
          widthExpand
          valueTemplate={(value) => (
            <FrontendBundleModeValue>
              {renderFrontendBundleMode(value?.[0] as FrontendBundleMode)}
            </FrontendBundleModeValue>
          )}
          itemTemplate={(option, isActive) =>
            renderFrontendBundleMode(option.value as FrontendBundleMode, isActive)
          }
        />

        {!user.data.isGuest && (
          <>
            <ChatBubbleButton />

            {/* help icon and menu vvv */}
            <HeaderButton
              icon="help"
              ref={helpButtonRef}
              onClick={() => handleToggleMenu('help')}
              className={clsx({ active: menuOpen === 'help' })}
              variant="nav"
            />
            <MenuContainer id="help" target={helpButtonRef.current}>
              <HelpMenu user={user} />
            </MenuContainer>
            {/* help icon and menu ^^^ */}

            {/* Inbox icon */}
            <InboxNotificationIcon />

            {/* App icon and menu vvv */}
            <HeaderButton
              icon="apps"
              onClick={() => handleToggleMenu('app')}
              ref={appButtonRef}
              variant="nav"
              className={clsx({ active: menuOpen === 'app', notification: isSnoozing })}
            />

            <MenuContainer id="app" target={appButtonRef.current}>
              <AppMenu user={user} />
            </MenuContainer>
          </>
        )}
        {/* App icon and menu ^^^ */}

        {/* User icon and menu vvv */}
        <UserButton
          className={clsx({ active: menuOpen === 'user' })}
          onClick={() => handleToggleMenu('user')}
          aria-label="User menu"
          ref={userButtonRef}
          variant="nav"
        >
          <UserImage size={26} name={user?.name} imageKey={avatarKey} />
        </UserButton>
        <MenuContainer id="user" target={userButtonRef.current}>
          <UserMenu user={user} />
        </MenuContainer>
        {/* User icon and menu ^^^ */}
      </FlexWrapperEnd>
    </nav>
  )
}

export default Header
