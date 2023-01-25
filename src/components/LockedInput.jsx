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

const LockedInputRow = ({
  value,
  onSubmit,
  label,
  disabled,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  onEdit,
  type,
}) => {
  const [editingValue, setEditingValue] = useState(value)
  const [editing, setEditing] = useState(false)

  const handleOpen = () => {
    setEditingValue(value)
    setEditing(true)
  }

  const handleSubmit = () => {
    setEditing(false)
    onSubmit(editingValue)
  }

  const handleChange = (e) => {
    setEditingValue(e.target.value)
  }

  const handleCancel = () => {
    setEditing(false)
    setEditingValue(value)
  }

  return (
    <UsernameStyled label={label} key={label}>
      <InputText
        label={label}
        value={editing ? editingValue : value}
        disabled={!editing}
        onChange={handleChange}
        type={type}
      />
      {!disabled &&
        (editing ? (
          <>
            <Button icon="cancel" onClick={handleCancel} label={cancelLabel} />
            <Button icon="done" onClick={handleSubmit} label={saveLabel} />
          </>
        ) : (
          <Button icon="edit" onClick={onEdit || handleOpen} />
        ))}
    </UsernameStyled>
  )
}

LockedInputRow.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  saveLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onEdit: PropTypes.func,
  type: PropTypes.string,
}

export default LockedInputRow
