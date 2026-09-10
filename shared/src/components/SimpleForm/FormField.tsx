import React from 'react'
import {
  InputNumber,
  InputText,
  InputTextarea,
  InputSwitch,
  Dropdown,
  DefaultItemTemplate,
} from '@ynput/ayon-react-components'
import { Badge } from '../Badge'
import { FormFileUpload, FormFileDownload, type FormFileData } from './FormFile'
import type { FormOptionItem, SimpleFormField } from '@shared/api'
import type { SimpleFormValue } from './types'

const DropdownItemTemplate = (option: FormOptionItem) => {
  const endContent = (
    <>
      <div style={{ flex: 1 }} />
      {option.badges && option.badges.map((badge, index) => <Badge key={index} label={badge} />)}
    </>
  )
  return (
    <DefaultItemTemplate
      option={option}
      dataKey={'value'}
      labelKey={'label'}
      value={[`${option.value}`]}
      endContent={endContent}
    />
  )
}

export interface FormFieldProps {
  field: SimpleFormField
  value: SimpleFormValue
  onChange: (value: SimpleFormValue) => void
}

/**
 * Renders the input for a single (non-label) field. `field` is expected to
 * already be the *effective* field - static definition with any matching
 * rule's patch (readOnly/disabled/hidden/options/...) merged on top - SimpleForm
 * does that merging, this component just renders whatever it's handed.
 */
export const FormField = ({ field, value, onChange }: FormFieldProps) => {
  const isDisabled = !!(field.disabled || field.readOnly)

  if (field.type === 'text') {
    const parsedValue = typeof value === 'string' ? value : ''
    if (field.multiline) {
      return (
        <InputTextarea
          value={parsedValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          disabled={isDisabled}
        />
      )
    }
    return (
      <InputText
        value={parsedValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
        disabled={isDisabled}
      />
    )
  }
  if (field.type === 'boolean') {
    const parsedValue = typeof value === 'boolean' ? value : false

    const handleCheckboxEvent = (
      event: React.ChangeEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if ('target' in event && 'checked' in event.target) {
        onChange((event.target as HTMLInputElement).checked)
      }
    }

    return (
      <InputSwitch checked={parsedValue} onChange={handleCheckboxEvent} disabled={isDisabled} />
    )
  }
  if (field.type === 'integer') {
    const parsedValue = typeof value === 'number' ? value : 0
    return (
      <InputNumber
        value={parsedValue}
        onChange={(e) => onChange(parseInt(e.target.value))}
        placeholder={field.placeholder || ''}
        disabled={isDisabled}
      />
    )
  }
  if (field.type === 'float') {
    const parsedValue = typeof value === 'number' ? value : 0.0
    return (
      <InputNumber
        type="number"
        value={parsedValue}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        placeholder={field.placeholder || ''}
        disabled={isDisabled}
      />
    )
  }

  if (field.type === 'select') {
    const parsedValue = typeof value === 'string' ? value : ''
    return (
      <Dropdown
        widthExpand
        options={field.options || []}
        value={parsedValue ? [parsedValue] : []}
        onSelectionChange={(e) => onChange(e[0])}
        className={`form-field`}
        multiSelect={false}
        itemTemplate={DropdownItemTemplate}
        placeholder={field.placeholder}
        disabled={isDisabled}
      />
    )
  } // Handle select

  if (field.type === 'multiselect') {
    const parsedValue = Array.isArray(value) ? value.map((value) => `${value}`) : []
    return (
      <Dropdown
        widthExpand
        options={field.options || []}
        value={parsedValue}
        onSelectionChange={(e) => onChange(e)}
        className={`form-field`}
        multiSelect={true}
        itemTemplate={DropdownItemTemplate}
        placeholder={field.placeholder}
        disabled={isDisabled}
      />
    )
  }

  if (field.type === 'file') {
    if (value && (value as FormFileData)?.download) {
      return <FormFileDownload value={value as FormFileData} />
    }
    return (
      <FormFileUpload
        value={value as FormFileData}
        onChange={onChange}
        validExtensions={field.valid_extensions}
      />
    )
  }
}
