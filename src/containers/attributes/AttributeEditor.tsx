import { FC, useEffect, useState } from 'react'

import {
  SaveButton,
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
import { AttributeData, AttributeModel, AttributeEnumItem } from '@shared/api'

const SCOPE_OPTIONS = [
  { value: 'project', label: 'Project' },
  { value: 'folder', label: 'Folder' },
  { value: 'task', label: 'Task' },
  { value: 'product', label: 'Product' },
  { value: 'version', label: 'Version' },
  { value: 'representation', label: 'Representation' },
  { value: 'user', label: 'User' },
]

// Define types for constants
interface GlobalFieldEntry {
  value: keyof AttributeData
  scope: (AttributeModel['scope'] | '')[] | null
}

const GLOBAL_FIELDS: GlobalFieldEntry[] = [
  { value: 'description', scope: null },
  { value: 'example', scope: null },
  // @ts-expect-error - project is not a scope?
  { value: 'default', scope: ['project'] },
  { value: 'inherit', scope: null },
]

interface TypeOptionDef {
  value: AttributeData['type']
  label: string
  fields: (keyof AttributeData)[]
  exclude?: (keyof AttributeData)[]
}

interface TypeOptionsMap {
  [key: string]: TypeOptionDef
}

const TYPE_OPTIONS: TypeOptionsMap = {
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

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type AttributeForm = PartialBy<AttributeModel, 'scope' | 'position'>

export interface AttributeEditorProps {
  attribute: AttributeForm | null
  existingNames: string[]
  error?: string
  isUpdating?: boolean
  excludes?: (keyof Omit<AttributeModel, 'data'> | keyof AttributeData)[]
  onHide: () => void
  onEdit: (attribute: AttributeForm) => void
}

const AttributeEditor: FC<AttributeEditorProps> = ({
  attribute,
  existingNames,
  error = '',
  isUpdating,
  excludes = [],
  onHide,
  onEdit,
}) => {
  const [formData, setFormData] = useState<AttributeForm | null>(attribute)

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

  // const setTopLevelData = (key: string, value: string) => {
  const setTopLevelData = <K extends keyof Omit<AttributeModel, 'data'>>(
    key: K,
    value: AttributeModel[K],
  ) => {
    setFormData((d) => {
      if (!d) {
        return d
      }
      return { ...d, [key]: value }
    })
  }

  // const setData = (key, value) => {
  const setData = <K extends keyof AttributeData>(key: K, value: AttributeData[K]) => {
    setFormData((d) => {
      // Add a check for d and d.data
      if (!d || !d.data) {
        return d
      }
      const dt = { ...d.data, [key]: value }
      return { ...d, data: dt }
    })
  }

  let internalError = ''
  if (formData) {
    if (isNew) {
      if (existingNames.includes(formData.name)) internalError = 'This attribute already exists'
      else if (!formData.name.match('^[a-zA-Z_]{2,20}$')) internalError = 'Invalid attribute name'
    } // name validation
  }

  const handleSubmit = () => {
    if (formData) {
      onEdit(formData)
    }
  }

  const footer = (
    <div style={{ display: 'flex', width: '100%', flexDirection: 'row' }}>
      <Spacer />
      <SaveButton
        label={isNew ? 'Create Attribute' : 'Save Attribute'}
        icon={'check'}
        disabled={!!internalError || !formData}
        active={!internalError && !!formData}
        saving={isUpdating}
        onClick={handleSubmit}
      />
    </div>
  )

  let dataFields: (keyof AttributeData)[] = []

  // add global fields, only if scope are null (all) or the scope is included
  GLOBAL_FIELDS.forEach((globalField) => {
    // @ts-expect-error - project scope will never be found here?
    if (!globalField?.scope || globalField?.scope?.some((s) => formData?.scope?.includes(s))) {
      dataFields.push(globalField.value)
    }
  })

  if (formData?.data.type && TYPE_OPTIONS[formData.data.type]) {
    const typeOpt = TYPE_OPTIONS[formData.data.type]
    dataFields = [...dataFields, ...typeOpt.fields].filter((f) => !typeOpt.exclude?.includes(f))
  }

  type CustomFieldRenderer = (value: any, onChange: (newValue: any) => void) => JSX.Element | null
  const customFields: {
    enum: CustomFieldRenderer
    inherit: CustomFieldRenderer
    booleanDefault: CustomFieldRenderer
  } = {
    enum: (value = [], onChange) => (
      <EnumEditor
        values={value as AttributeEnumItem[]}
        onChange={(val) => {
          onChange(val)
        }}
      />
    ),
    inherit: (value, onChange) => (
      <InputSwitch
        checked={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
      />
    ),
    booleanDefault: (value, onChange) => (
      <InputSwitch
        checked={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
      />
    ),
  }

  const handleTitleChange = (e: React.ChangeEvent) => {
    const v = (e.target as HTMLInputElement).value
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
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          handleSubmit()
        }
      }}
    >
      {formData && (
        <FormLayout>
          {!excludes.includes('title') && (
            <FormRow label={'Title'} key={'title'}>
              <InputText value={formData?.data['title']} onChange={handleTitleChange} autoFocus />
            </FormRow>
          )}
          {!excludes.includes('name') && (
            <FormRow label={'Name'} key={'name'}>
              <LockedInput
                value={formData.name}
                disabled={!isNew}
                onSubmit={(v) => setTopLevelData('name', v)}
                label="name"
              />
            </FormRow>
          )}
          {!excludes.includes('scope') && (
            <FormRow label="Scope">
              <Dropdown
                options={SCOPE_OPTIONS}
                disabled={formData.builtin}
                value={formData.scope || []}
                onChange={(v) => setTopLevelData('scope', v as AttributeModel['scope'])}
                multiSelect
                widthExpand
              />
            </FormRow>
          )}
          {!excludes.includes('type') && (
            <FormRow label="Type">
              <Dropdown
                value={[formData?.data?.type]}
                disabled={formData.builtin}
                options={Object.values(TYPE_OPTIONS)}
                onChange={(v) => setData('type', v[0] as AttributeData['type'])}
                minSelected={1}
                widthExpand
              />
            </FormRow>
          )}
          {dataFields.map((field) => {
            // skip if field is excluded
            if (excludes.includes(field)) return null

            let fieldComp = null
            let fieldLabel = upperFirst(field)

            if (field === 'enum' || field === 'inherit') {
              const renderer = customFields[field as 'enum' | 'inherit']
              fieldComp = renderer(formData?.data[field], (value) => setData(field, value))
            } else if (field === 'default' && formData?.data?.type === 'boolean') {
              fieldComp = customFields['booleanDefault'](
                formData?.data[field] as boolean,
                (value) => setData(field, value as AttributeData['default']),
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
                      if (!d || !d.data) return d
                      const dt = { ...d.data, ...v }
                      return { ...d, data: dt }
                    })
                  }
                />
              )

              // rewrite field to min or max for display label
              fieldLabel = field === 'ge' ? 'Min' : 'Max'
            } else {
              const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const strValue = e.target.value
                switch (field) {
                  case 'minLength':
                  case 'maxLength':
                  case 'minItems':
                  case 'maxItems': {
                    const num = parseInt(strValue, 10)
                    setData(field, isNaN(num) ? undefined : num)
                    break
                  }
                  default:
                    // For string fields ('description', 'regex') or 'any' type fields ('example', 'default')
                    setData(field, strValue as AttributeData[typeof field])
                    break
                }
              }

              fieldComp = (
                <InputText
                  value={String(formData?.data[field] ?? '')}
                  onChange={handleInputChange}
                />
              )
            }

            return (
              <FormRow
                label={fieldLabel}
                key={field}
                style={{
                  alignItems: 'flex-start',
                }}
              >
                {fieldComp}
              </FormRow>
            )
          })}
          <span>
            {(internalError || error) && (
              <span className="form-error-text">{internalError || error}</span>
            )}
          </span>
        </FormLayout>
      )}
    </Dialog>
  )
}

export default AttributeEditor
