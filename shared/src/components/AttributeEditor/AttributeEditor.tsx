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
  Button,
} from '@ynput/ayon-react-components'
import { camelCase, upperFirst } from 'lodash'
import { MinMaxField } from './components'
import { EnumEditor } from '@shared/components/EnumEditor'
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
type Excludes = (keyof Omit<AttributeModel, 'data'> | keyof AttributeData)[]

const initFormData: AttributeForm = {
  name: '',
  scope: ['folder', 'task'],
  builtin: false,
  position: 0,
  data: {
    type: 'string',
    title: '',
    description: '',
    example: '',
    default: undefined,
    enum: undefined,
    minLength: undefined,
    maxLength: undefined,
    regex: '',
    minItems: undefined,
    maxItems: undefined,
    ge: undefined,
    gt: undefined,
    le: undefined,
    lt: undefined,
  },
}

// build the form data based on excludes and to update any data
const buildInitFormData = (excludes: Excludes, data?: Partial<AttributeForm>) => {
  // Create a deep clone of init form data
  const formData = JSON.parse(JSON.stringify(initFormData)) as AttributeForm

  // Filter out top-level excludes if not in required
  const required = ['name']
  Object.keys(formData).forEach((key) => {
    if (
      !required.includes(key) &&
      excludes.includes(key as keyof Omit<AttributeModel, 'data'>) &&
      key !== 'data'
    ) {
      delete formData[key as keyof AttributeForm]
    }
  })

  // Filter out data field excludes if not in in required
  const requiredData = ['title']
  if (formData.data) {
    Object.keys(formData.data).forEach((key) => {
      if (!requiredData.includes(key) && excludes.includes(key as keyof AttributeData)) {
        delete formData.data[key as keyof AttributeData]
      }
    })
  }

  // Merge with provided data if any
  if (data) {
    // Merge top-level fields
    Object.keys(data).forEach((key) => {
      const typedKey = key as keyof AttributeForm
      if (typedKey !== 'data' && excludes.includes(typedKey)) return

      if (typedKey === 'data' && data.data && formData.data) {
        // Deep merge of data fields
        formData.data = { ...formData.data, ...data.data }
      } else if (data[typedKey] !== undefined) {
        // @ts-ignore - We know these properties exist
        formData[typedKey] = data[typedKey]
      }
    })
  }

  return formData
}

export interface AttributeEditorProps {
  attribute: AttributeForm | null
  existingNames: string[]
  error?: string
  isUpdating?: boolean
  excludes?: Excludes
  onHide: () => void
  onEdit: (attribute: AttributeForm) => void
  onDelete?: () => void
}

export const AttributeEditor: FC<AttributeEditorProps> = ({
  attribute,
  existingNames,
  error = '',
  isUpdating,
  excludes = [],
  onHide,
  onEdit,
  onDelete,
}) => {
  const initForm = buildInitFormData(excludes, { position: existingNames.length })
  const [formData, setFormData] = useState<AttributeForm | null>(attribute || initForm)

  useEffect(() => {
    if (!!attribute) setFormData(attribute)
  }, [attribute])

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
      else if (!formData.name.match('^[a-zA-Z_]{2,64}$')) error = 'Invalid attribute name'
    } // name validation
  }

  const handleSubmit = () => {
    if (formData) {
      onEdit(formData)
    }
  }

  const footer = (
    <div style={{ display: 'flex', width: '100%', flexDirection: 'row' }}>
      {onDelete && attribute && (
        <Button
          variant="danger"
          label={'Delete attribute'}
          icon={'delete'}
          disabled={isUpdating}
          onClick={onDelete}
        />
      )}
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
          onChange(val?.length ? val : undefined)
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
                  onChange={(v) => {
                    const geValue = v.ge !== undefined ? Number(v.ge) : undefined
                    const leValue = v.le !== undefined ? Number(v.le) : undefined

                    if (
                      // @ts-expect-error
                      (v.ge !== undefined && isNaN(geValue)) ||
                      // @ts-expect-error
                      (v.le !== undefined && isNaN(leValue))
                    ) {
                      // Do not update the form if the value is not a valid number
                      return
                    }

                    setFormData((d) => {
                      if (!d || !d.data) return d
                      const dt = { ...d.data, ...v }
                      return { ...d, data: dt }
                    })
                  }}
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
