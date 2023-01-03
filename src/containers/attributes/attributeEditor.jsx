import { useEffect, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { MultiSelect } from 'primereact/multiselect'
import { Dropdown } from 'primereact/dropdown'
import { Button, Spacer, FormLayout, FormRow, InputText } from '@ynput/ayon-react-components'

const SCOPE_OPTIONS = [
  { value: 'project', label: 'Project' },
  { value: 'folder', label: 'Folder' },
  { value: 'task', label: 'Task' },
  { value: 'subset', label: 'Subset' },
  { value: 'version', label: 'Version' },
  { value: 'representation', label: 'Representation' },
  { value: 'user', label: 'User' },
]

const TYPE_OPTIONS = [
  { value: 'string', label: 'String' },
  { value: 'integer', label: 'Integer' },
  { value: 'float', label: 'Decimal number' },
]

const AttributeEditor = ({ attribute, existingNames, onHide, onEdit }) => {
  const [formData, setFormData] = useState(null)

  useEffect(
    () =>
      setFormData(
        attribute || {
          name: 'newAttribute',
          builtin: false,
          scope: ['folder', 'task'],
          position: existingNames.length,
          data: { title: 'New attribute', type: 'string' },
        },
      ),
    [attribute],
  )

  const isNew = !attribute

  const setTopLevelData = (key, value) => {
    setFormData((d) => {
      return { ...d, [key]: value }
    })
  }

  const setData = (key, value) => {
    setFormData((d) => {
      const dt = { ...d.data, [key]: value }
      return { ...d, data: dt }
    })
  }

  let error = null
  if (formData) {
    if (isNew) {
      if (existingNames.includes(formData.name)) error = 'This attribute already exists'
      else if (!formData.name.match('^[a-zA-Z_]{2,20}$')) error = 'Invalid attribute name'
    } // name validation
  }

  const footer = (
    <div style={{ display: 'flex', width: '100%', flexDirection: 'row' }}>
      <Spacer />
      <Button
        label={isNew ? 'Create attribute' : 'Update attribute'}
        icon="check"
        disabled={!!error}
        onClick={() => onEdit(formData)}
      />
    </div>
  )

  return (
    <Dialog
      header={formData?.data?.title || formData?.name}
      footer={footer}
      onHide={onHide}
      visible={true}
      style={{ minWidth: 400 }}
    >
      {formData && (
        <FormLayout>
          <FormRow label="Name">
            <InputText
              value={formData.name}
              disabled={!isNew}
              onChange={(e) => setTopLevelData('name', e.target.value)}
            />
          </FormRow>
          <FormRow label="Scope">
            <MultiSelect
              options={SCOPE_OPTIONS}
              disabled={formData.builtin}
              value={formData.scope}
              onChange={(e) => setTopLevelData('scope', e.target.value)}
            />
          </FormRow>
          <FormRow label="Type">
            <Dropdown
              value={formData?.data.type}
              disabled={formData.builtin}
              options={TYPE_OPTIONS}
              onChange={(e) => setData('type', e.target.value)}
            />
          </FormRow>
          <FormRow label="Title">
            <InputText
              value={formData.data.title || ''}
              onChange={(e) => setData('title', e.target.value)}
            />
          </FormRow>
          <FormRow label="Example">
            <InputText
              value={formData.data.example || ''}
              onChange={(e) => setData('example', e.target.value)}
            />
          </FormRow>
          <FormRow>{error && <span className="form-error-text">{error}</span>}</FormRow>
        </FormLayout>
      )}
    </Dialog>
  )
}

export default AttributeEditor
