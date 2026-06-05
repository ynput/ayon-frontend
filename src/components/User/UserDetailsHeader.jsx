import React, { useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import DetailHeader from '../DetailHeader'
import { Button, Dialog, Icon, UserImagesStacked } from '@ynput/ayon-react-components'
import { Menu, MenuContainer } from '@shared/components'
import { useMenuContext } from '@shared/context'
import CodeEditor from '@uiw/react-textarea-code-editor'
import { copyToClipboard } from '@shared/util'
import styled from 'styled-components'

const SubHeader = styled.span`
  white-space: nowrap;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
`

const UserDetailsHeader = ({ users = [], onClose, subTitle = '', style = {}, menuItems }) => {
  // a single user
  const singleUserEdit = users.length === 1 ? users[0] || ' ' : null

  const getUserName = (user) => user?.attrib?.fullName || user?.name

  const title = singleUserEdit ? getUserName(singleUserEdit) : `${users.length} Users Selected`

  const buttonRef = useRef(null)
  const { menuOpen, toggleMenuOpen, setMenuOpen } = useMenuContext()
  const [showContext, setShowContext] = useState(false)

  const menuId = useMemo(() => {
    const seed = users.map((u) => u?.name).filter(Boolean).join(',') || 'none'
    return `user-detail-more-menu-${seed}`
  }, [users])

  const isOpen = menuOpen === menuId
  const hasMenu = Array.isArray(menuItems) && menuItems.length > 0
  const fullItems = hasMenu
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

UserDetailsHeader.propTypes = {
  users: PropTypes.arrayOf(PropTypes.object),
  onClose: PropTypes.func,
  subTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  style: PropTypes.object,
  menuItems: PropTypes.array,
}

export default UserDetailsHeader
