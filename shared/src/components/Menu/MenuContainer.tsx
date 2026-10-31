import React, { useEffect, ReactNode } from 'react'
import { useMenuContext } from '@shared/context'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import * as Styled from './Menu.styled'
import { useMenuPosition } from './useMenuPosition'

// DOM ids of the menu portal — exported so other menu code (mouse-leave heuristics,
// hit-testing, etc.) can reference them by constant instead of magic strings.
export const MENU_PORTAL_DIALOG_ID = 'ayon-menu-dialog'
export const MENU_PORTAL_CONTENT_ID = 'ayon-menu-content'

type AlignType = 'left' | 'right'
type ThemeType = 'light' | 'dark'

interface MenuContainerProps {
  id: string | undefined
  target?: HTMLElement | null
  targetId?: string
  align?: AlignType
  theme?: ThemeType
  /** open state kept by the caller instead of the app's one open menu (`menuOpen === id`) */
  isOpen?: boolean
  /** with `isOpen`: called to close it (`onClose` stays the dialog's own event) */
  onDismiss?: () => void
  children: ReactNode
  [key: string]: any
}

export const MenuContainer: React.FC<MenuContainerProps> = ({
  id,
  target,
  targetId = '',
  align = 'right',
  theme = 'light',
  isOpen: isOpenProp,
  onDismiss,
  children,
  ...props
}) => {
  const { menuOpen, setMenuOpen, navigate } = useMenuContext()
  const isOpen = isOpenProp ?? menuOpen === id

  const handleClose = () => {
    if (isOpenProp !== undefined) onDismiss?.()
    else setMenuOpen(false)
  }

  const handleNavigate = (path?: string) => {
    console.log('navigate and close')
    handleClose()
    if (!navigate && path) {
      console.log('navigate not found')
    } else if (navigate && path) {
      navigate(path)
    }
  }

  if (!isOpen) return null

  return (
    <MenuInner
      {...{
        handleClose,
        handleNavigate,
        target,
        targetId,
        align,
        theme,
        children,
        ...props,
      }}
    />
  )
}

interface MenuInnerProps {
  handleClose: () => void
  handleNavigate: (path?: string) => void
  target?: HTMLElement | null
  targetId?: string
  align?: AlignType
  children: ReactNode
  [key: string]: any
}

const MenuInner: React.FC<MenuInnerProps> = ({
  handleClose,
  handleNavigate,
  target,
  targetId,
  align = 'right',
  children,
  ...props
}) => {
  const { position, menuRef } = useMenuPosition(target ?? null, targetId ?? '', align)

  // Focus management
  useEffect(() => {
    if (position && menuRef.current) {
      const first = menuRef.current.querySelectorAll('li, button')[0] as HTMLElement
      first?.focus()
    }
  }, [position])

  // Keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Escape') return
    // only the menu closes: the portal still bubbles through the React tree, so a dialog or
    // popover the menu was opened from would close too
    e.preventDefault()
    e.stopPropagation()
    handleClose()
    const focusTarget = target ?? (targetId ? document.getElementById(targetId) : null)
    focusTarget?.focus()
  }

  // Click outside handling: on this menu's backdrop, not on one of a menu opened from inside it
  // (its click still bubbles here through the React tree)
  const handleOnClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) handleClose()
  }

  // Attach props to children
  const childrenWithProps = React.Children.map(children, (child, i) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onClose: handleClose,
        index: i,
        navigate: handleNavigate,
      } as any)
    }
    return child
  })

  const menuPosition = position || { top: 0, left: 0, opacity: 0, visibility: 'hidden' as const }

  return createPortal(
    <Styled.Dialog
      open={true}
      onClick={handleOnClick}
      onKeyDown={handleKeyDown}
      {...props}
      id={MENU_PORTAL_DIALOG_ID}
    >
      <Styled.DialogContent
        id={MENU_PORTAL_CONTENT_ID}
        style={menuPosition}
        className={clsx(align)}
        ref={menuRef as any}
      >
        {childrenWithProps}
      </Styled.DialogContent>
    </Styled.Dialog>,
    document.body,
  )
}
