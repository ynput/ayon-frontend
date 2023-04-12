import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, InputText } from 'ayon-react-components-test'
import styled from 'styled-components'

const UsernameStyled = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;

  input {
    flex: 1;
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
  editIcon = 'edit',
  fullUnlock,
  type,
  style,
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

    if (fullUnlock) {
      onSubmit(e.target.value)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setEditingValue(value)
  }

  return (
    <UsernameStyled key={label} style={style}>
      <InputText
        label={'test' || false}
        value={editing ? editingValue : value}
        disabled={!editing}
        onChange={handleChange}
        type={type}
      />
      {!disabled &&
        (editing ? (
          <>
            <Button
              icon={fullUnlock ? 'lock' : 'cancel'}
              onClick={handleCancel}
              label={cancelLabel}
            />
            {!fullUnlock && <Button icon="done" onClick={handleSubmit} label={saveLabel} />}
          </>
        ) : (
          <Button icon={editIcon} onClick={onEdit || handleOpen} />
        ))}
    </UsernameStyled>
  )
}

LockedInputRow.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onSubmit: PropTypes.func,
  disabled: PropTypes.bool,
  saveLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onEdit: PropTypes.func,
  type: PropTypes.string,
  style: PropTypes.object,
  labelStyle: PropTypes.object,
}

export default LockedInputRow
