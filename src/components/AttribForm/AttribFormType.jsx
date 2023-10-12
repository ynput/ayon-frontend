import {
  Dropdown,
  InputDate,
  InputNumber,
  InputSwitch,
  InputText,
} from '@ynput/ayon-react-components'
import { isEmpty, isEqual } from 'lodash'
import React from 'react'

const AttribFormType = ({ type, value, onChange, id, enumLabels = {}, format, ...props }) => {
  let options = []
  for (const key in enumLabels) {
    options.push({ label: enumLabels[key], value: key })
  }

  const handleChange = (e, v) => {
    e?.preventDefault()

    let newValue = v ?? e?.target?.value ?? null

    if (type === 'date' && newValue) {
      newValue = new Date(newValue)
      newValue = newValue.toISOString()
    }

    // only change if value is different
    if (isEqual(value, newValue)) return

    onChange(id, newValue)
  }

  const sharedProps = { value, onChange: handleChange, id, ...props, autoComplete: 'off' }

  if (format === 'date-time') type = 'date'
  if (!isEmpty(enumLabels) && type !== 'array') type = 'array-single'

  switch (type) {
    case 'string':
      return <InputText {...sharedProps} />
    case 'number':
      return <InputNumber {...sharedProps} step={0.01} min={0} />
    case 'integer':
      return <InputNumber {...sharedProps} step={1} min={0} />
    case 'boolean':
      return <InputSwitch checked={value} onChange={() => handleChange(null, !value)} />
    case 'date':
      return (
        <InputDate
          {...sharedProps}
          onChange={() => console.log('date changed')}
          selected={!!value && new Date(value)}
          onSelect={(v) => handleChange(null, v)}
          dateFormat={'dd/MM/yyyy'}
        />
      )
    case 'array':
      return (
        <Dropdown
          value={value || []}
          onChange={(v) => handleChange(null, v)}
          options={options}
          search={options.length > 5}
          onClear={value?.length ? () => handleChange(null, []) : false}
          multiSelect
          style={{ width: '100%' }}
        />
      )
    case 'array-single':
      return (
        <Dropdown
          value={[value]}
          onChange={(v) => handleChange(null, v[0])}
          options={options}
          search={options.length > 5}
          multiple={false}
          onClear={() => handleChange(null, null)}
          style={{ width: '100%' }}
        />
      )
    default:
      return value
  }
}

export default AttribFormType
