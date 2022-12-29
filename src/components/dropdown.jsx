import PropTypes from 'prop-types'
import { useState } from 'react'
import styled, { css, keyframes } from 'styled-components'

// background acts as a blocker
const BackdropStyled = styled.div`
  position: fixed;
  inset: 0;
  background-color: unset;
  z-index: 11;
`

const warningMoveIn = keyframes`
  from {
    top: 0;
  }
  to {
    top: -100%;
  }
`

const moveDown = keyframes`
  from {
    min-height: 18px;
  }
  to {
    min-height: 27px;
  }
`

const ContainerStyled = styled.div`
  position: relative;
  height: ${({ height }) => `${height}px`};
  width: 100%;

  /* show warning when changing multiple entities */
  ${({ isOpen, message }) =>
    isOpen &&
    message &&
    css`
      &::before {
        content: '${message}';
        bottom: 27px;
        position: absolute;
        background-color: var(--color-grey-00);
        border-radius: var(--border-radius) var(--border-radius) 0 0;
        z-index: 10;
        display: flex;
        align-items: center;
        padding: 6px 0;
        right: 0;
        left: 0;
        outline: 1px solid #383838;
        justify-content: center;

        animation: ${warningMoveIn} 0.3s forwards;
      }
    `}
`

const OptionsStyled = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: inherit;

  display: flex;
  flex-direction: column;

  border-radius: var(--border-radius);

  outline: none;
  background-color: unset;
  z-index: 10;
  height: ${({ height }) => `${height}px`};

  ${({ isOpen, message, index }) =>
    isOpen &&
    css`
      margin: 0px;
      /* same border used as primereact dropdowns */
      outline: 1px solid #383838;
      background-color: var(--color-grey-00);
      z-index: 20;
      border-radius: ${message
        ? '0 0 var(--border-radius) var(--border-radius)'
        : 'var(--border-radius)'};
      overflow: clip;

      /* calc open height based on number of options */
      height: ${({ height, length }) => `${height * length}px`};

      & > * {
        animation: ${moveDown} 0.3s;
      }

      *:nth-child(${index + 1}) {
        animation: unset;
      }
    `}

  transition: height 0.3s;
`

const Dropdown = ({ children, value, style, options, message }) => {
  const [isOpen, setIsOpen] = useState(false)

  // number of options to choose from sets height for animation
  const length = options.length
  const closedHeight = style.height || 27

  // get index of current value
  const index = options.map(({ name }) => name).indexOf(value)
  // const index =

  return (
    <>
      {isOpen && <BackdropStyled onClick={() => setIsOpen(false)} />}
      <ContainerStyled
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        style={style}
        height={closedHeight}
        message={message}
        isOpen={isOpen}
      >
        <OptionsStyled
          isOpen={isOpen}
          length={length}
          height={closedHeight}
          message={message}
          index={index}
        >
          {children({ isOpen, selected: value })}
        </OptionsStyled>
      </ContainerStyled>
    </>
  )
}

Dropdown.propTypes = {
  children: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  style: PropTypes.object,
  options: PropTypes.array.isRequired,
  message: PropTypes.string,
}

export default Dropdown
