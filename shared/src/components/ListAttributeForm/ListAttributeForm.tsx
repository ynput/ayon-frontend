import { FC, useCallback, useEffect, useState, useMemo } from 'react'
import { AttributeField, DetailsPanelAttributesEditor } from '../DetailsPanelAttributes'
import { EntityListModel, useGetProjectQuery, useUpdateEntityListMutation } from '@shared/api'
import { toast } from 'react-toastify'

interface ListAttributeFormProps {
  projectName: string
  list?: EntityListModel
  isLoading?: boolean
  categoryEnum?: Array<{ value: string; label: string }>
}

// explicit type for the form state
type FormValue = string | number | boolean | any[] | Record<string, any> | Date | null | undefined

interface ListFormData {
  label: string
  tags: string[]
  active: boolean
  // index signature so the object is compatible with DetailsPanelAttributesEditor expected form shape
  [key: string]: FormValue
}

// Helper function to check if a field should be stored in data
const isDataField = (fieldName: string): boolean => {
  return fieldName.startsWith('data.')
}

// Helper function to extract data field name
const getDataFieldName = (fieldName: string): string => {
  return fieldName.replace('data.', '')
}

// Helper function to get all data field names from field definitions
const getDefinedDataFields = (fields: AttributeField[]): string[] => {
  return fields
    .filter((field) => isDataField(field.name))
    .map((field) => getDataFieldName(field.name))
}

export const ListAttributeForm: FC<ListAttributeFormProps> = ({
  projectName,
  list,
  isLoading,
  categoryEnum = [],
}) => {
  const [form, setForm] = useState<ListFormData>({
    label: '',
    tags: [],
    active: false,
  })

  const { data: project } = useGetProjectQuery({ projectName })

  const fields: AttributeField[] = useMemo(
    () => [
      { name: 'label', data: { type: 'string', title: 'Label' } },
      {
        name: 'tags',
        data: {
          type: 'list_of_strings',
          title: 'Tags',
          enum: project?.tags?.map((t) => ({ value: t.name, label: t.name, color: t.color })),
          enableCustomValues: true,
          enableSearch: true,
        },
      },
      { name: 'active', data: { type: 'boolean', title: 'Active' } },
      {
        name: 'data.category',
        data: {
          type: 'string',
          title: 'Category',
          enum: categoryEnum,
        },
        enableCustomValues: true,
        enableSearch: true,
        allowNone: true,
      },
    ],
    [project?.tags, categoryEnum],
  )

  useEffect(() => {
    if (list) {
      const parsedData = list.data || {}

      // Get only the data fields that are defined in the fields array
      const definedDataFields = getDefinedDataFields(fields)
      const dataFieldValues = definedDataFields.reduce((acc, dataFieldName) => {
        const fieldKey = `data.${dataFieldName}`
        const fieldValue = (parsedData as Record<string, any>)[dataFieldName]
        // Default to empty string for all data fields
        acc[fieldKey] = fieldValue || ''
        return acc
      }, {} as Record<string, any>)

      setForm({
        label: list?.label || '',
        tags: list?.tags || [],
        active: list?.active ?? false,
        ...dataFieldValues,
      })
    }
  }, [list, fields])

  const [updateList] = useUpdateEntityListMutation()

  const handleChange = useCallback(
    async (key: string, value: any) => {
      if (!list?.id) return console.warn('No list ID provided')

      let updatePayload: any

      if (isDataField(key)) {
        // For data fields, we need to update the nested data structure
        const dataFieldName = getDataFieldName(key)
        const currentData = list.data || {}

        // If the value is empty string for category, set it to null to clear it
        if (value === '' && dataFieldName === 'category') {
          updatePayload = {
            data: {
              ...currentData,
              [dataFieldName]: null,
            },
          }
        } else {
          updatePayload = {
            data: {
              ...currentData,
              [dataFieldName]: value,
            },
          }
        }

        // Update local form state
        setForm((prev) => ({ ...prev, [key]: value }))
      } else {
        // For other fields, update normally
        const newValue = { [key]: value }
        updatePayload = newValue
        // Update local form state
        setForm((prev) => ({ ...prev, ...newValue }))
      }

      // update the list in the database in the background
      try {
        await updateList({
          listId: list.id,
          projectName,
          entityListPatchModel: updatePayload,
        })
      } catch (error: any) {
        console.error(error)
        toast.error('Failed to update list attribute: ', error.data.detail)
      }
    },
    [list?.id, list?.data, projectName, updateList],
  )

  return (
    <DetailsPanelAttributesEditor
      enableEditing
      fields={fields}
      form={form}
      isLoading={isLoading}
      onChange={handleChange}
      title="Attributes"
    />
  )
}
