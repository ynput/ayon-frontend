import React from 'react'
import PropTypes from 'prop-types'
import { Button, InputText } from 'ayon-react-components-test'
import styled from 'styled-components'

const FormStyled = styled.form`
  display: flex;

  button {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  input {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
`

const CreateButton = ({
  icon = 'add',
  placeholder = 'New item...',
  value,
  onChange,
  onSubmit,
  noSpaces,
}) => {
  const pattern = noSpaces ? '^\\S+$' : ''

  return (
    <FormStyled onSubmit={onSubmit}>
      <Button icon={icon} />
      <InputText placeholder={placeholder} value={value} onChange={onChange} pattern={pattern} />
    </FormStyled>
  )
}

CreateButton.propTypes = {
  icon: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
}

export default CreateButton
