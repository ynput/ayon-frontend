import React, { useEffect, ReactNode } from 'react'
import { useMenuContext } from '@shared/context/MenuContext'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import * as Styled from './Menu.styled'
import { useMenuPosition } from './useMenuPosition'

type AlignType = 'left' | 'right'
type ThemeType = 'light' | 'dark'

interface MenuContainerProps {
  id: string | undefined
  target?: HTMLElement | null
  targetId?: string
  align?: AlignType
  theme?: ThemeType
  children: ReactNode
  [key: string]: any
}

export const MenuContainer: React.FC<MenuContainerProps> = ({
  id,
  target,
  targetId = '',
  align = 'right',
  theme = 'light',
  children,
  ...props
}) => {
  const { menuOpen, setMenuOpen, navigate } = useMenuContext()
  const isOpen = menuOpen === id

  const handleClose = () => {
    setMenuOpen(false)
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
    if (e.key === 'Escape') handleClose()
  }

  // Click outside handling
  const handleOnClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if ((e.target as HTMLElement).id === 'dialog') handleClose()
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
      id="dialog"
    >
      <Styled.DialogContent
        id="content"
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
