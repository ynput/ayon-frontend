import { useState, useEffect } from 'react'
import {
  ScrollPanel,
  Button,
  Spacer,
  Toolbar,
  Dialog,
  FormLayout,
  FormRow,
  InputText,
  InputSwitch,
  Dropdown,
} from '@ynput/ayon-react-components'

const getDefaults = (fields, values) => {
  const defaults = {}
  fields.forEach((item) => {
    if (item.name in values) {
      defaults[item.name] = values[item.name]
    } else if (item.value) {
      defaults[item.name] = item.value
    } else if (item.type === 'checkbox') {
      defaults[item.name] = false
    } else if (item.type === 'integer') {
      defaults[item.name] = 0
    } else if (item.type === 'float') {
      defaults[item.name] = 0.0
    } else if (item.type === 'text') {
      defaults[item.name] = ''
    }
  })
  return defaults
}

const FormItem = ({ item, value, onChange }) => {
  if (item.type === 'text') {
    return (
      <InputText
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={item.placeholder || ''}
      />
    )
  }
  if (item.type === 'checkbox') {
    return <InputSwitch checked={value} onChange={(e) => onChange(e.target.checked)} />
  }
  if (item.type === 'integer') {
    return (
      <InputText
        type="number"
        value={value || 0}
        onChange={(e) => onChange(parseInt(e.target.value))}
        placeholder={item.placeholder || ''}
      />
    )
  }
  if (item.type === 'float') {
    return (
      <InputText
        type="number"
        value={value || 0.0}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        placeholder={item.placeholder || ''}
      />
    )
  }

  if (item.type === 'select') {
    return (
      <Dropdown
        widthExpand
        options={item.options || []}
        value={value ? [value] : []}
        onSelectionChange={(e) => onChange(e[0])}
        className={`form-field`}
        multiSelect={false}
      />
    )
  }
}

const SimpleFormDialog = ({ fields, values, onClose, onSubmit, isOpen, header }) => {
  const [formData, setFormData] = useState(null)
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
      variant="dialog"
      isOpen={isOpen}
      onClose={onClose}
      header={header}
      footer={footer}
      style={{ minHeight: 400, minWidth: 500 }}
    >
      <ScrollPanel style={{ flexGrow: 1, background: 'transparent' }}>
        <FormLayout style={{ width: '95%' }}>
          {fields.map((item, index) => {
            if (item.type === 'label') {
              return <h2 key={index}>{item.text}</h2>
            }

            return (
              <FormRow key={index} label={item.label || ''}>
                <FormItem
                  item={item}
                  value={formData[item.name]}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      [item.name]: value,
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
