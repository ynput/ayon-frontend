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
  height: 100%;
  width: max-content;
`

const OptionsStyled = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: inherit;

  display: flex;
  flex-direction: column;

  border-radius: var(--border-radius);
  margin: 2px 0;
  top: 0;
  outline: none;
  background-color: unset;
  z-index: 10;

  ${({ isOpen }) =>
    isOpen &&
    css`
      margin: 0px;
      top: -1px;
      /* same border used as primereact dropdowns */
      outline: 1px solid #383838;
      background-color: var(--color-grey-00);
      z-index: 20;
      border-radius: var(--border-radius);
      overflow: clip;
    `}
`

const Dropdown = ({ children, onChange, value, style }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {isOpen && <BackdropStyled onClick={() => setIsOpen(false)} />}
      <ContainerStyled onClick={() => setIsOpen(!isOpen)} style={style}>
        <OptionsStyled isOpen={isOpen} onClick={onChange}>
          {children({ isOpen, selected: value })}
        </OptionsStyled>
      </ContainerStyled>
    </>
  )
}

Dropdown.propTypes = {
  children: PropTypes.func,
  //   onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  style: PropTypes.object,
}

export default Dropdown
