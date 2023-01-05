import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { InputText } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const RowStyled = styled.form`
  display: flex;
  gap: 6px;
  align-items: center;

  button {
    border: none;
    padding: 0;
    background-color: unset;
    cursor: pointer;
  }
`

const ContainerStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const EnumEditor = ({ values = [], onChange }) => {
  values = values || []
  const valuesValues = useMemo(() => values.map(({ value }) => value), [values])
  const initForm = { value: '', label: '' }
  const [form, setForm] = useState(initForm)

  const handleOnChange = (e, index) => {
    // check for white spaces
    if (e.target.id === 'value' && e.target.value.indexOf(' ') >= 0) return

    const newValue = e.target.value

    const newValues = [...values]
    newValues.splice(index, 1, { ...values[index], [e.target.id]: newValue })

    onChange(newValues)
  }

  const handleAddChange = (e) => {
    e.preventDefault()

    // check for white spaces
    if (e.target.id === 'value' && e.target.value.indexOf(' ') >= 0) return

    setForm({ ...form, [e.target.id]: e.target.value })
  }

  //   submiting (adding) a new item
  const handleAddItem = (e) => {
    e.preventDefault()

    // ensure both inputs are not empty
    if (!form.label || !form.value) return

    // ensure value is unique and no spaces
    if (valuesValues.includes(form.value) && form.value.indexOf(' ') >= 0) return

    // add new value to array
    const newValues = [...values, form]

    onChange(newValues)
    // clear form
    setForm(initForm)
  }

  const handleDeleteItem = (e, index) => {
    e.preventDefault()
    const newValues = [...values]
    // remove item from array
    newValues.splice(index, 1)

    onChange(newValues)
  }

  return (
    <ContainerStyled>
      {values.map(({ value, label }, index) => (
        <RowStyled key={index}>
          <label htmlFor="value">value</label>
          <InputText value={value} id={'value'} onChange={(e) => handleOnChange(e, index)} />
          <label htmlFor="label">label</label>
          <InputText value={label} id={'label'} onChange={(e) => handleOnChange(e, index)} />
          <button
            className="material-symbols-outlined"
            id={value}
            onClick={(e) => handleDeleteItem(e, index)}
          >
            close
          </button>
        </RowStyled>
      ))}
      <RowStyled onSubmit={handleAddItem}>
        <label htmlFor="value">value</label>
        <InputText
          id="value"
          value={form.value}
          onChange={handleAddChange}
          error={valuesValues.includes(form.value)}
        />
        <label htmlFor="label">label</label>
        <InputText id="label" value={form.label} onChange={handleAddChange} />
        <button type="submit" className="material-symbols-outlined" onClick={handleAddItem}>
          add
        </button>
      </RowStyled>
    </ContainerStyled>
  )
}

EnumEditor.propTypes = {
  values: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })),
  onChange: PropTypes.func,
}

export default EnumEditor
