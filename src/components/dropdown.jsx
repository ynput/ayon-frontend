import PropTypes from 'prop-types'
import { useEffect } from 'react'
import { useState } from 'react'
import { useRef } from 'react'
import styled, { css, keyframes } from 'styled-components'

// background acts as a blocker
const BackdropStyled = styled.div`
  position: fixed;
  inset: 0;
  background-color: unset;
  z-index: 11;
`

const dropdownMenuAnimation = keyframes`
  0% {
    transform: scale(.95);
    opacity: .6;
}
100% {
    transform: scale(1);
    opacity: 1;
}
`

const ContainerStyled = styled.div`
  position: relative;
  height: ${({ height }) => `${height}px`};
  width: auto;
  display: inline-block;

  position: fixed;
  z-index: 60;

  transform-origin: top;

  ${({ startAnimation }) =>
    startAnimation
      ? css`
          animation: ${dropdownMenuAnimation} 0.03s ease-in forwards;
        `
      : css`
          opacity: 0;
        `}

  /* position: fixed; */

  /* show warning when changing multiple entities */
  ${({ isOpen, message }) =>
    isOpen &&
    message &&
    css`
      &::before {
        content: '${message}';
        top: 0;
        translate: 0 -100%;
        position: absolute;
        background-color: var(--color-grey-00);
        border-radius: var(--border-radius) var(--border-radius) 0 0;
        z-index: 10;
        display: flex;
        align-items: center;
        padding: 4px 0;
        right: 0;
        left: 0;
        outline: 1px solid #383838;
        justify-content: center;
      }
    `}
`

const OptionsStyled = styled.div`
  width: auto;

  display: flex;
  flex-direction: column;

  margin: 0px;
  /* same border used as primereact dropdowns */
  outline: 1px solid #383838;
  background-color: var(--color-grey-00);
  z-index: 20;
  border-radius: ${({ message }) =>
    message ? '0 0 var(--border-radius) var(--border-radius)' : 'var(--border-radius)'};
  overflow: clip;

  ${({ index }) =>
    css`
      *:nth-child(${index + 1}) {
        animation: unset;
      }
    `}

  transition: height 0.15s;
`

const Dropdown = ({
  opened,
  value,
  style,
  options,
  message,
  onClose,
  onOpen,
  closed,
  widthExpand,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [pos, setPos] = useState({ x: null, y: null })
  const [startAnimation, setStartAnimation] = useState(false)
  const [minWidth, setMinWidth] = useState()

  // get index of current value
  const index = options.map(({ name }) => name).indexOf(value)

  const closedRef = useRef(null)
  const openedRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      const closedRec = closedRef.current.getBoundingClientRect()
      const closedWidth = closedRec.width

      const openedRec = openedRef.current.getBoundingClientRect()
      const openedWidth = openedRec.width
      const openedheight = openedRec.height

      let x = closedRec.x
      let y = closedRec.y

      if (align === 'right') {
        x = x + closedRec - openedWidth
      }

      // check it's not vertically off screen
      if (openedheight + y > window.innerHeight) {
        y = window.innerHeight - openedheight
      }

      // first set position
      setPos({ x, y })
      if (widthExpand) setMinWidth(closedWidth)

      // then start animation
      setStartAnimation(true)
    } else {
      setStartAnimation(false)
    }
  }, [isOpen])

  const handleOpen = (e) => {
    e.stopPropagation()
    setIsOpen(true)

    onOpen && onOpen()
  }

  const handleClose = (e) => {
    e.stopPropagation()
    setIsOpen(false)
    onClose && onClose()
  }

  return (
    <>
      {closed && (
        <div ref={closedRef} onClick={handleOpen}>
          {closed}
        </div>
      )}
      {isOpen && <BackdropStyled onClick={handleClose} />}
      {isOpen && opened && (
        <ContainerStyled
          onClick={handleClose}
          style={{ left: pos?.x, top: pos?.y, ...style }}
          message={message}
          isOpen={true}
          startAnimation={startAnimation}
        >
          <OptionsStyled
            isOpen={true}
            message={message}
            index={index}
            ref={openedRef}
            style={{ minWidth }}
          >
            {opened}
          </OptionsStyled>
        </ContainerStyled>
      )}
    </>
  )
}

Dropdown.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  style: PropTypes.object,
  options: PropTypes.array.isRequired,
  message: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  closed: PropTypes.node.isRequired,
  opened: PropTypes.node.isRequired,
  align: PropTypes.oneOf(['left', 'right']),
}

export default Dropdown
