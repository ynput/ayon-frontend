import { useEffect, useState } from 'react'

import {
  Button,
  Spacer,
  FormLayout,
  FormRow,
  InputText,
  InputSwitch,
  LockedInput,
  Dropdown,
  Dialog,
} from '@ynput/ayon-react-components'
import { camelCase, upperFirst } from 'lodash'
import MinMaxField from '@components/MinMaxField/MinMaxField'
import EnumEditor from '@components/EnumEditor/EnumEditor'

const SCOPE_OPTIONS = [
  { value: 'project', label: 'Project' },
  { value: 'folder', label: 'Folder' },
  { value: 'task', label: 'Task' },
  { value: 'product', label: 'Product' },
  { value: 'version', label: 'Version' },
  { value: 'representation', label: 'Representation' },
  { value: 'user', label: 'User' },
]

const GLOBAL_FIELDS = [
  { value: 'description', scope: null },
  { value: 'example', scope: null },
  { value: 'default', scope: ['project'] },
  { value: 'inherit', scope: null },
]

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
  boolean: {
    value: 'boolean',
    label: 'Boolean',
    fields: [],
    exclude: ['example'],
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
        label={isNew ? 'Create Attribute' : 'Save Attribute'}
        icon={'check'}
        disabled={!!error}
        onClick={() => onEdit(formData)}
      />
    </div>
  )

  let dataFields = []

  // add global fields, only if scope are null (all) or the scope is included
  GLOBAL_FIELDS.forEach((field) => {
    if (!field?.scope || field?.scope?.some((s) => formData?.scope?.includes(s))) {
      dataFields.push(field.value)
    }
  })

  if (TYPE_OPTIONS[formData?.data.type]) {
    dataFields = [...dataFields, ...TYPE_OPTIONS[formData?.data.type].fields].filter(
      (f) => !TYPE_OPTIONS[formData?.data.type].exclude?.includes(f),
    )
  }

  const customFields = {
    enum: (value = [], onChange) => (
      <EnumEditor
        values={value}
        onChange={(value) => {
          onChange(value)
        }}
      />
    ),
    inherit: (value, onChange) => (
      <InputSwitch checked={value} onChange={(e) => onChange(e.target.checked)} />
    ),
    booleanDefault: (value, onChange) => (
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
      header={formData?.data?.title || formData?.name || 'New attribute'}
      footer={footer}
      onClose={onHide}
      isOpen={true}
      style={{ width: 700, zIndex: 999 }}
      size="full"
      variant="dialog"
    >
      {formData && (
        <FormLayout>
          <FormRow label={'Title'} key={'title'}>
            <InputText value={formData?.data['title']} onChange={handleTitleChange} />
          </FormRow>
          <FormRow label={'Name'} key={'name'}>
            <LockedInput
              value={formData.name}
              disabled={!isNew}
              onSubmit={(v) => setTopLevelData('name', v)}
              label="name"
            />
          </FormRow>
          <FormRow label="Scope">
            <Dropdown
              options={SCOPE_OPTIONS}
              disabled={formData.builtin}
              value={formData.scope}
              onChange={(v) => setTopLevelData('scope', v)}
              multiSelect
              widthExpand
            />
          </FormRow>
          <FormRow label="Type">
            <Dropdown
              value={[formData?.data?.type]}
              disabled={formData.builtin}
              options={Object.values(TYPE_OPTIONS)}
              onChange={(v) => setData('type', v[0])}
              minSelected={1}
              widthExpand
            />
          </FormRow>
          {dataFields.map((field) => {
            let fieldComp = null
            if (field in customFields) {
              fieldComp = customFields[field](formData?.data[field], (value) =>
                setData(field, value),
              )
            } else if (field === 'default' && formData?.data?.type === 'boolean') {
              fieldComp = customFields['booleanDefault'](formData?.data[field], (value) =>
                setData(field, value),
              )
            } else if (['ge', 'gt', 'le', 'lt'].includes(field)) {
              // ignore gt and lt
              if (['gt', 'lt'].includes(field)) return null
              fieldComp = (
                <MinMaxField
                  value={formData?.data}
                  isMin={field === 'ge'}
                  isFloat={formData?.data?.type === 'float'}
                  onChange={(v) =>
                    setFormData((d) => {
                      const dt = { ...d.data, ...v }
                      return { ...d, data: dt }
                    })
                  }
                />
              )

              // rewrite field to min or max
              field = field === 'ge' ? 'min' : 'max'
            } else {
              fieldComp = (
                <InputText
                  value={formData?.data[field] || ''}
                  onChange={(e) => setData(field, e.target.value)}
                />
              )
            }

            return (
              <FormRow
                label={upperFirst(field)}
                key={field}
                style={{
                  alignItems: 'flex-start',
                }}
              >
                {fieldComp}
              </FormRow>
            )
          })}
          <FormRow>{error && <span className="form-error-text">{error}</span>}</FormRow>
        </FormLayout>
      )}
    </Dialog>
  )
}

export default AttributeEditor
