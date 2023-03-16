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

  transition: height 0.15s;

  /* scrolling */
  max-height: 300px;
  overflow-y: auto;
`

const Dropdown = ({
  value,
  options,
  style,
  message,
  onClose,
  onOpen,
  widthExpand,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [pos, setPos] = useState({ x: null, y: null })
  const [startAnimation, setStartAnimation] = useState(false)
  const [minWidth, setMinWidth] = useState()

  const valueRef = useRef(null)
  const optionsRef = useRef(null)

  useEffect(() => {
    if (isOpen && valueRef.current && optionsRef.current) {
      const valueRec = valueRef.current.getBoundingClientRect()
      const valueWidth = valueRec.width

      const optionsRec = optionsRef.current.getBoundingClientRect()
      const optionsWidth = optionsRec.width
      const optionsheight = optionsRec.height

      let x = valueRec.x
      let y = valueRec.y

      if (align === 'right') {
        x = x + valueRec - optionsWidth
      }

      // check it's not vertically off screen
      if (optionsheight + y > window.innerHeight) {
        y = window.innerHeight - optionsheight
      }

      // first set position
      setPos({ x, y })
      if (widthExpand) setMinWidth(valueWidth)

      // then start animation
      setStartAnimation(true)
    } else {
      setStartAnimation(false)
    }
  }, [isOpen, valueRef, optionsRef, setMinWidth, setStartAnimation, setPos])

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
      {value && (
        <div ref={valueRef} onClick={handleOpen}>
          {value}
        </div>
      )}
      {isOpen && <BackdropStyled onClick={handleClose} />}
      {isOpen && options && (
        <ContainerStyled
          onClick={handleClose}
          style={{ left: pos?.x, top: pos?.y, ...style }}
          message={message}
          isOpen={true}
          startAnimation={startAnimation}
        >
          <OptionsStyled isOpen={true} message={message} ref={optionsRef} style={{ minWidth }}>
            {options}
          </OptionsStyled>
        </ContainerStyled>
      )}
    </>
  )
}

Dropdown.propTypes = {
  message: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  style: PropTypes.object,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  value: PropTypes.node.isRequired,
  options: PropTypes.node.isRequired,
  align: PropTypes.oneOf(['left', 'right']),
}

export default Dropdown
