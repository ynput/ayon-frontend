import PropTypes from 'prop-types'
import { useState } from 'react'
import styled from 'styled-components'

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
  /* same border used as primereact dropdowns */
  outline: ${(props) => (props.isOpen ? '1px solid #383838;' : 'none')};

  background-color: ${(props) => (props.isOpen ? 'var(--color-grey-00)' : 'unset')};
  z-index: ${(props) => (props.isOpen ? 20 : 10)};

  & > * {
    &:hover {
      background-color: ${(props) => (props.isOpen ? 'var(--color-grey-02)' : 'unset')};
    }
  }
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
