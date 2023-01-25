import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { FormRow, InputText, Button } from '@ynput/ayon-react-components'

const UsernameStyled = styled(FormRow)`
  .field {
    flex-direction: row;
    gap: 5px;

    input {
      flex: 1;
    }
  }
`

const LockedInput = ({ value, onEdit, label, icon = 'edit', type = 'text', placeholder }) => {
  return (
    <UsernameStyled label={label} key={label}>
      <InputText
        label={label}
        value={value}
        disabled={true}
        type={type}
        placeholder={placeholder}
      />
      {onEdit && <Button icon={icon} onClick={onEdit} />}
    </UsernameStyled>
  )
}

LockedInput.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onEdit: PropTypes.func,
  icon: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
}

export default LockedInput
