import styled from 'styled-components'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  ScrollPanel,
  Button,
  Spacer,
  Dialog,
  FormLayout,
  FormRow,
  InputText,
  InputSwitch,
  Dropdown,
} from '@ynput/ayon-react-components'

type SimpleFormFieldType =
  | 'text'
  | 'boolean'
  | 'integer'
  | 'float'
  | 'select'
  | 'label'
  | 'hidden'
  | 'multiselect'
type SimpleFormHighlightType = 'info' | 'warning' | 'error'


interface SimpleFormFieldOption {
  value: string
  label: string
}


interface SimpleFormField {
  type: SimpleFormFieldType
  text?: string
  name: string
  label?: string
  placeholder?: any
  value?: string
  regex?: string
  required?: boolean
  multiline?: boolean
  options?: SimpleFormFieldOption[]
  highlight?: SimpleFormHighlightType
}

const getDefaults = (fields: SimpleFormField[], values: Record<string, any>) => {
  const defaults: Record<string, any> = {}
  fields.forEach((field) => {
    if (field.name in values) {
      defaults[field.name] = values[field.name]
    } else if (field.value) {
      defaults[field.name] = field.value
    } else if (field.type === 'boolean') {
      defaults[field.name] = false
    } else if (field.type === 'integer') {
      defaults[field.name] = 0
    } else if (field.type === 'float') {
      defaults[field.name] = 0.0
    } else if (field.type === 'text') {
      defaults[field.name] = ''
    }
  })
  return defaults
}

const LabelContainer = styled.div`
  &.normal {
    // maybe something here
  }

  &.info,
  &.warning,
  &.error {
    padding: 0.5rem;
    text-align: center;
    font-weight: bold;
  }

  &.info {
    background-color: var(--md-sys-color-on-secondary-dark);
  }
  &.warning {
    background-color: var(--md-sys-color-warning-container-dark);
  }
  &.error {
    background-color: var(--md-sys-color-on-error-dark);
  }
`

type FormLabelProps = {
  field: SimpleFormField
}

const FormLabel = ({ field }: FormLabelProps) => {
  return (
    <LabelContainer className={field.highlight || 'normal'}>
      <ReactMarkdown>{field.text || ''}</ReactMarkdown>
    </LabelContainer>
  )
}

type FormFieldProps = {
  field: SimpleFormField
  value: any
  onChange: (value: any) => void
}

const FormField = ({ field, value, onChange }: FormFieldProps) => {
  if (field.type === 'text') {
    return (
      <InputText
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
      />
    )
  }
  if (field.type === 'boolean') {
    return (
      <InputSwitch
        checked={value}
        onChange={(e) => onChange((e.target as React.HTMLElement).checked)}
      />
    )
  }
  if (field.type === 'integer') {
    return (
      <InputText
        type="number"
        value={value || 0}
        onChange={(e) => onChange(parseInt(e.target.value))}
        placeholder={field.placeholder || ''}
      />
    )
  }
  if (field.type === 'float') {
    return (
      <InputText
        type="number"
        value={value || 0.0}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        placeholder={field.placeholder || ''}
      />
    )
  }

  if (field.type === 'select') {
    return (
      <Dropdown
        widthExpand
        options={field.options || []}
        value={value ? [value] : []}
        onSelectionChange={(e) => onChange(e[0])}
        className={`form-field`}
        multiSelect={false}
      />
    )
  }
}

interface SimpleFormDialogProps {
  fields: SimpleFormField[]
  values?: Record<string, any>
  onClose: () => void
  onSubmit: (values: Record<string, any>) => void
  isOpen: boolean
  header?: string
}


const SimpleFormDialog = ({ fields, values, onClose, onSubmit, isOpen, header }:SimpleFormDialogProps) => {
  const [formData, setFormData] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    if (isOpen) {
      const defaults = getDefaults(fields, values || {})
      setFormData(defaults)
    }
  }, [isOpen, fields, values])

  if (!isOpen) return null
  if (!formData) return null

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Spacer />
      <Button onClick={() => onSubmit(formData)} icon="checklist" label="Submit" variant="filled" />
    </div>
  )

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      header={header}
      footer={footer}
      style={{ minHeight: 400, minWidth: 500 }}
    >
      <ScrollPanel style={{ flexGrow: 1, background: 'transparent' }}>
        <FormLayout style={{ width: '95%' }}>
          {fields.map((field: SimpleFormField) => {
            if (field.type === 'label') {
              return <FormLabel key={field.name} field={field} />
            }

            return (
              <FormRow key={field.name} label={field.label || ''}>
                <FormField
                  field={field}
                  value={formData[field.name]}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      [field.name]: value,
                    }))
                  }}
                />
              </FormRow>
            )
          })}
        </FormLayout>
      </ScrollPanel>
    </Dialog>
  )
}

export default SimpleFormDialog
