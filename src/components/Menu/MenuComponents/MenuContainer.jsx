import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setMenuOpen } from '@state/context'
import * as Styled from './Menu.styled'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'

const MenuContainer = ({ id, target, targetId = '', children, ...props }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isOpen = useSelector((state) => state.context.menuOpen) === id
  const handleClose = () => {
    // close menu
    dispatch(setMenuOpen(false))
  }

  const handleNavigate = (path) => {
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
        children,
        ...props,
      }}
    />
  )
}

const MenuInner = ({ handleClose, handleNavigate, target, targetId, children, ...props }) => {
  const dialogRef = useRef(null)

  // when the menu is open, focus the first element
  // this is used to allow keyboard navigation
  const [pos, setPos] = useState(null)
  useEffect(() => {
    if (pos) {
      const first = dialogRef.current.querySelectorAll('li, button')[0]
      first && first.focus()
    }
  }, [pos, dialogRef])

  // if target is a element, find it's position bottom and right
  // then set the style of the dialog to position it there

  function calculatePos(target) {
    const rect = target.getBoundingClientRect()
    return {
      top: rect.bottom + 8 - 42,
      right: window.innerWidth - rect.right,
    }
  }

  useEffect(() => {
    if (target) {
      setPos(calculatePos(target))
    } else if (targetId) {
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        setPos(calculatePos(targetElement))
      }
    } else {
      console.log('no target or targetId')
    }
  }, [target, targetId])

  // attach the handleClose as a prop to each child
  children = React.Children.map(children, (child, i) => {
    return React.cloneElement(child, { onClose: handleClose, index: i, navigate: handleNavigate })
  })

  const handleKeyDown = (e) => {
    // close on esc
    if (e.key === 'Escape') handleClose()
  }

  const handleOnClick = (e) => {
    if (e.target.id === 'dialog') handleClose()
  }

  if (!pos) return

  return createPortal(
    <Styled.Dialog
      open={true}
      onClick={handleOnClick}
      onKeyDown={handleKeyDown}
      {...props}
      ref={dialogRef}
      id="dialog"
    >
      <Styled.DialogContent id="content" style={{ ...pos }}>
        {children}
      </Styled.DialogContent>
    </Styled.Dialog>,
    document.body,
  )
}

export default MenuContainer
