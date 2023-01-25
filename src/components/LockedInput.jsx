import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, FormRow, InputText } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const UsernameStyled = styled(FormRow)`
  .field {
    flex-direction: row;
    gap: 5px;

    input {
      flex: 1;
    }
  }
`

const LockedInputRow = ({ value, onChange, label, disabled, saveLabel = 'save' }) => {
  const [editingValue, setEditingValue] = useState(value)
  const [editing, setEditing] = useState(false)

  const handleOpen = () => {
    setEditingValue(value)
    setEditing(true)
  }

  const handleClose = () => {
    setEditing(false)
    onChange(editingValue)
  }

  const handleChange = (e) => {
    setEditingValue(e.target.value)
  }

  return (
    <UsernameStyled label={label} key={label}>
      <InputText
        label={label}
        value={editing ? editingValue : value}
        disabled={!editing}
        onChange={handleChange}
      />
      {!disabled &&
        (editing ? (
          <Button icon="done" onClick={handleClose} label={saveLabel} />
        ) : (
          <Button icon="edit" onClick={handleOpen} />
        ))}
    </UsernameStyled>
  )
}

LockedInputRow.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  saveLabel: PropTypes.string,
}

export default LockedInputRow
