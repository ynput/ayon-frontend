import { useEffect, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import {
  Button,
  Spacer,
  FormLayout,
  FormRow,
  InputText,
  InputSwitch,
  LockedInput,
  Dropdown,
} from '@ynput/ayon-react-components'
import EnumEditor from './enumEditor'
import { camelCase } from 'lodash'

const SCOPE_OPTIONS = [
  { value: 'project', label: 'Project' },
  { value: 'folder', label: 'Folder' },
  { value: 'task', label: 'Task' },
  { value: 'subset', label: 'Subset' },
  { value: 'version', label: 'Version' },
  { value: 'representation', label: 'Representation' },
  { value: 'user', label: 'User' },
]

// Fields used on all types
const GLOBAL_FIELDS = ['description', 'example', 'default', 'inherit']

const TYPE_OPTIONS = {
  string: {
    value: 'string',
    label: 'String',
    fields: ['minLength', 'maxLength', 'enum', 'regex'],
  },
  integer: {
    value: 'integer',
    label: 'Integer',
    fields: ['ge', 'gt', 'le', 'lt'],
  },
  float: {
    value: 'float',
    label: 'Decimal number',
    fields: ['ge', 'gt', 'le', 'lt'],
  },
  list_of_strings: {
    value: 'list_of_strings',
    label: 'List Of Strings',
    fields: ['minItems', 'maxItems', 'enum'],
  },
}

const AttributeEditor = ({ attribute, existingNames, onHide, onEdit }) => {
  const [formData, setFormData] = useState(null)

  useEffect(
    () =>
      setFormData(
        attribute || {
          name: '',
          builtin: false,
          scope: ['folder', 'task'],
          position: existingNames.length,
          data: { type: 'string' },
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

  let dataFields = [...GLOBAL_FIELDS]
  if (TYPE_OPTIONS[formData?.data.type]) {
    dataFields = [...dataFields, ...TYPE_OPTIONS[formData?.data.type].fields]
  }

  const customFields = {
    enum: (value = [], onChange) => (
      <EnumEditor values={value} onChange={(value) => onChange(value)} />
    ),
    inherit: (value, onChange) => (
      <InputSwitch checked={value} onChange={(e) => onChange(e.target.checked)} />
    ),
  }

  const handleTitleChange = (e) => {
    const v = e.target.value
    setData('title', v)

    if (isNew) {
      setTopLevelData('name', camelCase(v))
    }
  }

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
          <FormRow label={'title'} key={'title'}>
            <InputText value={formData?.data['title']} onChange={handleTitleChange} />
          </FormRow>
          <FormRow label={'name'} key={'name'}>
            <LockedInput
              value={formData.name}
              disabled={!isNew}
              onSubmit={(v) => setTopLevelData('name', v)}
              label="name"
            />
          </FormRow>
          <FormRow label="scope">
            <Dropdown
              options={SCOPE_OPTIONS}
              disabled={formData.builtin}
              value={formData.scope}
              onChange={(v) => setTopLevelData('scope', v)}
              multiSelect
              widthExpand
            />
          </FormRow>
          <FormRow label="type">
            <Dropdown
              value={[formData?.data?.type]}
              disabled={formData.builtin}
              options={Object.values(TYPE_OPTIONS)}
              onChange={(v) => setData('type', v[0])}
              minSelected={1}
              widthExpand
            />
          </FormRow>
          {dataFields.map((field) => (
            <FormRow
              label={field}
              key={field}
              style={{
                alignItems: 'flex-start',
              }}
            >
              {field in customFields ? (
                customFields[field](formData?.data[field], (value) => setData(field, value))
              ) : (
                <InputText
                  value={formData?.data[field] || ''}
                  onChange={(e) => setData(field, e.target.value)}
                />
              )}
            </FormRow>
          ))}
          <FormRow>{error && <span className="form-error-text">{error}</span>}</FormRow>
        </FormLayout>
      )}
    </Dialog>
  )
}

export default AttributeEditor
