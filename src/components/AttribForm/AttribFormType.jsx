import { Dropdown, InputDate, InputNumber, InputText } from '@ynput/ayon-react-components'
import { isEqual } from 'lodash'
import React from 'react'

const AttribFormType = ({ type, value, onChange, id, enumLabels = {}, ...props }) => {
  let options = []
  for (const key in enumLabels) {
    options.push({ label: enumLabels[key], value: key })
  }

  const handleChange = (e, v) => {
    e?.preventDefault()

    let newValue = v ?? e.target.value

    if (type === 'date' && newValue) {
      newValue = new Date(newValue)
      newValue = newValue.toLocaleDateString()
    }

    console.log(value, newValue)
    // only change if value is different
    if (isEqual(value, newValue)) return

    onChange({ [id]: newValue })
  }

  const sharedProps = { value, onChange: handleChange, id, ...props, autoComplete: 'off' }

  switch (type) {
    case 'string':
      return <InputText {...sharedProps} />
    case 'number':
      return <InputNumber {...sharedProps} step={0.01} min={0} />
    case 'integer':
      return <InputNumber {...sharedProps} step={1} min={0} />
    case 'date':
      return (
        <InputDate
          {...sharedProps}
          selected={!!value && new Date(value)}
          onChange={(date) => handleChange(null, date)}
          dateFormat={'dd/MM/yyyy'}
        />
      )
    case 'array':
      return (
        <Dropdown
          value={value}
          onChange={(v) => handleChange(null, v)}
          options={options}
          search={options.length > 5}
        />
      )
    default:
      return value
  }
}

export default AttribFormType
