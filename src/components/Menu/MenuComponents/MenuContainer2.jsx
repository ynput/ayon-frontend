import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setMenuOpen } from '@state/context'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import * as Styled from './Menu.styled'
import useMenuPosition from './useMenuPosition'


const MenuContainerV2 = ({
  id,
  target,
  targetId = '',
  align = 'right',
  theme = 'light',
  children,
  ...props
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isOpen = useSelector((state) => state.context.menuOpen) === id
  
  const handleClose = () => {
    dispatch(setMenuOpen(false))
  }

  const handleNavigate = (path) => {
    console.log('navigate and close')
    handleClose()
    if (path) navigate(path)
  }

  if (!isOpen) return null

  return (
    <MenuInner2
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

const MenuInner2 = ({
  handleClose,
  handleNavigate,
  target,
  targetId,
  align = 'right',
  children,
  ...props
}) => {
  const { position, menuRef } = useMenuPosition(target, targetId)
  
  // Focus management
  useEffect(() => {
    if (position && menuRef.current) {
      const first = menuRef.current.querySelectorAll('li, button')[0]
      first?.focus()
    }
  }, [position])
  
  // Keyboard handling
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleClose()
  }
  
  // Click outside handling
  const handleOnClick = (e) => {
    if (e.target.id === 'dialog') handleClose()
  }
  
  // Attach props to children
  const childrenWithProps = React.Children.map(children, (child, i) => {
    return React.cloneElement(child, { 
      onClose: handleClose, 
      index: i, 
      navigate: handleNavigate 
    })
  })
  
  if (!position) return null
  
  return createPortal(
    <Styled.Dialog
      open={true}
      onClick={handleOnClick}
      onKeyDown={handleKeyDown}
      {...props}
      ref={menuRef}
      id="dialog"
    >
      <Styled.DialogContent 
        id="content" 
        style={position} 
        className={clsx(align)}
      >
        {childrenWithProps}
      </Styled.DialogContent>
    </Styled.Dialog>,
    document.body
  )
}

export default MenuContainerV2
