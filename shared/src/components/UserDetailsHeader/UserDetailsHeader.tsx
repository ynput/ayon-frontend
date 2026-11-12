// The header of Settings > Users' details panel (also the team members'): the users' avatars,
// name and subtitle, and the more menu with the userDetails.menuItem slot.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import clsx from 'clsx'
import { Button, Dialog, Icon, UserImagesStacked } from '@ynput/ayon-react-components'
import { Menu, MenuContainer } from '../Menu'
import type { MenuItemType } from '../Menu'
import { CodeEditor } from '../CodeEditor'
import { useSlotTriggerProps } from '../AddonLayout/slotInspector'
import { useMenuContext } from '@shared/context'
import { copyToClipboard } from '@shared/util'
import { DetailHeader } from './DetailHeader'
import { SubHeader } from './DetailHeader.styled'
import type { UserDetailsHeaderUser } from './UserDetailsHeaderHelpers'

export interface UserDetailsHeaderProps {
  users?: UserDetailsHeaderUser[]
  onClose?: () => void
  subTitle?: ReactNode
  style?: CSSProperties
  /** the more menu's items; "View data" is added after them */
  menuItems?: MenuItemType[]
  /** called when the more menu opens */
  onMenuOpen?: () => void
}

export const UserDetailsHeader = ({
  users = [],
  onClose,
  subTitle = '',
  style = {},
  menuItems,
  onMenuOpen,
}: UserDetailsHeaderProps) => {
  // a single user
  const singleUserEdit = users.length === 1 ? users[0] : null

  const getUserName = (user: UserDetailsHeaderUser) => user?.attrib?.fullName || user?.name

  const title = singleUserEdit ? getUserName(singleUserEdit) : `${users.length} Users Selected`

  const buttonRef = useRef<HTMLButtonElement>(null)
  const { menuOpen, toggleMenuOpen, setMenuOpen } = useMenuContext()
  const [showContext, setShowContext] = useState(false)

  const menuId = useMemo(() => {
    const seed = users.map((u) => u?.name).filter(Boolean).join(',') || 'none'
    return `user-detail-more-menu-${seed}`
  }, [users])

  const isOpen = menuOpen === menuId
  useEffect(() => {
    if (isOpen) onMenuOpen?.()
  }, [isOpen, onMenuOpen])
  const hasMenu = Array.isArray(menuItems) && menuItems.length > 0
  const fullItems: MenuItemType[] = hasMenu
    ? [
        ...menuItems,
        {
          id: 'view-data',
          label: 'View data',
          icon: 'data_object',
          onClick: () => setShowContext(true),
        },
      ]
    : []

  const triggerProps = useSlotTriggerProps('userDetails.menuItem')
  const rawJson = useMemo(() => {
    try {
      return JSON.stringify(users, null, 2)
    } catch {
      return String(users)
    }
  }, [users])

  const rightActions = hasMenu ? (
    <>
      <Button
        ref={buttonRef}
        icon="more_horiz"
        variant="text"
        data-tooltip="More actions"
        aria-label="More actions"
        className={clsx({ active: isOpen })}
        {...triggerProps}
        onClick={() => toggleMenuOpen(menuId)}
      />
      <MenuContainer id={menuId} target={buttonRef.current} align="right">
        <Menu menu={fullItems} onClose={() => setMenuOpen(false)} />
      </MenuContainer>
    </>
  ) : null

  return (
    <>
      <DetailHeader
        onClose={onClose}
        context={hasMenu ? undefined : users}
        dialogTitle="User Context"
        style={style}
        rightActions={rightActions}
      >
        <UserImagesStacked
          users={users.map((user) => ({
            name: user.name || '',
            avatarUrl: user.name && `/api/users/${user.name}/avatar`,
            self: user?.self,
          }))}
        />
        <div>
          <h2>{title}</h2>
          <SubHeader>{subTitle}</SubHeader>
        </div>
      </DetailHeader>
      {hasMenu && showContext && (
        <Dialog
          header="User Context"
          isOpen
          onClose={() => setShowContext(false)}
          size="lg"
          style={{ width: '50vw' }}
        >
          <style>{`
            .details-dialog__code { position: relative; }
            .details-dialog__copy { position: absolute; right: 12px; top: 24px; z-index: 10; background: rgba(0,0,0,0.5); border-radius: 4px; padding: 6px; cursor: pointer; display: none; align-items: center; justify-content: center; }
            .details-dialog__code:hover .details-dialog__copy, .details-dialog__code:focus-within .details-dialog__copy { display: flex; }
            .w-tc-editor .token.property { color: #c9a5f7 !important; }
            .w-tc-editor .token.string { color: #6bc985 !important; }
            .w-tc-editor .token.number { color: #e5a66b !important; }
            .w-tc-editor .token.boolean { color: #e5a66b !important; }
            .w-tc-editor .token.null { color: #7a8a99 !important; }
            .w-tc-editor .token.punctuation { color: #b0bec5 !important; }
            .w-tc-editor .token.operator { color: #b0bec5 !important; }
            .details-dialog__code .w-tc-editor textarea { display: none !important; }
          `}</style>
          <div className="details-dialog__code">
            <div
              role="button"
              aria-label="Copy JSON"
              onClick={() => copyToClipboard(rawJson)}
              className="details-dialog__copy"
            >
              <Icon icon="content_copy" data-tooltip="Copy to clipboard" />
            </div>
            <CodeEditor
              wrap="off"
              value={rawJson}
              language="json"
              placeholder="Please enter JS code."
              readOnly
              data-color-mode="dark"
            />
          </div>
        </Dialog>
      )}
    </>
  )
}

export default UserDetailsHeader
