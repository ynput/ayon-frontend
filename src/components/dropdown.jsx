import PropTypes from 'prop-types'
import { useState } from 'react'
import styled, { css } from 'styled-components'

// background acts as a blocker
const BackdropStyled = styled.div`
  position: fixed;
  inset: 0;
  background-color: unset;
  z-index: 11;
`

const ContainerStyled = styled.div`
  position: relative;
  height: ${({ height }) => `${height}px`};
  width: 100%;
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

  ${({ isOpen }) =>
    isOpen &&
    css`
      margin: 0px;
      /* same border used as primereact dropdowns */
      outline: 1px solid #383838;
      background-color: var(--color-grey-00);
      z-index: 20;
      border-radius: var(--border-radius);
      overflow: clip;

      /* calc open height based on number of options */
      height: ${({ height, length }) => `${height * length}px`};
    `}

  transition: height 0.3s;
`

const Dropdown = ({ children, onChange, value, style, options }) => {
  const [isOpen, setIsOpen] = useState(false)

  // number of options to choose from sets height for animation
  const length = options.length
  const closedHeight = style.height || 27

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
      >
        <OptionsStyled isOpen={isOpen} onClick={onChange} length={length} height={closedHeight}>
          {children({ isOpen, selected: value })}
        </OptionsStyled>
      </ContainerStyled>
    </>
  )
}

Dropdown.propTypes = {
  children: PropTypes.func.isRequired,
  //   onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  style: PropTypes.object,
  options: PropTypes.array.isRequired,
}

export default Dropdown
