import React, { useEffect, ReactNode } from 'react'
import { useMenuContext } from '@shared/context/MenuContext'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const { menuOpen, setMenuOpen } = useMenuContext()
  const isOpen = menuOpen === id

  const handleClose = () => {
    setMenuOpen(false)
  }

  const handleNavigate = (path?: string) => {
    console.log('navigate and close')
    handleClose()
    if (path) navigate(path)
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

  if (!position) return null

  return createPortal(
    <Styled.Dialog
      open={true}
      onClick={handleOnClick}
      onKeyDown={handleKeyDown}
      {...props}
      ref={menuRef as any}
      id="dialog"
    >
      <Styled.DialogContent id="content" style={position} className={clsx(align)}>
        {childrenWithProps}
      </Styled.DialogContent>
    </Styled.Dialog>,
    document.body,
  )
}
