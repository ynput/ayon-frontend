import { FC, useCallback, useEffect, useState, useMemo } from 'react'
import { AttributeField, DetailsPanelAttributesEditor } from '../DetailsPanelAttributes'
import { EntityListModel, useUpdateEntityListMutation, useGetAttributeListQuery } from '@shared/api'
import { toast } from 'react-toastify'
import { useProjectContext } from '@shared/context'

interface ListAttributeFormProps {
  projectName: string
  list?: EntityListModel
  isLoading?: boolean
  attributes?: AttributeField[]
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

export const ListAttributeForm: FC<ListAttributeFormProps> = ({
  projectName,
  list,
  isLoading,
  attributes = [],
}) => {
  const [form, setForm] = useState<ListFormData>({
    label: '',
    tags: [],
    active: false,
  })

  // You must be an admin to edit the list itself
  const canEdit = (list?.accessLevel || 0) >= 30
  const { tags } = useProjectContext()

  // Fetch list-scoped attributes
  const { data: allAttributes = [] } = useGetAttributeListQuery()
  const listScopedAttributes = useMemo(
    () =>
      allAttributes
        .filter((attr) => attr.scope?.includes('list'))
        .map((attr) => ({
          name: attr.name,
          data: attr.data,
        })),
    [allAttributes],
  )

  const fields: AttributeField[] = useMemo(
    () => [
      { name: 'label', data: { type: 'string', title: 'Label' } },
      {
        name: 'tags',
        data: {
          type: 'list_of_strings',
          title: 'Tags',
          enum: tags?.map((t) => ({ value: t.name, label: t.name, color: t.color })),
          enableCustomValues: true,
          enableSearch: true,
        },
      },
      ...listScopedAttributes,
      { name: 'active', data: { type: 'boolean', title: 'Active' } },
      ...attributes,
    ],
    [tags, listScopedAttributes, attributes],
  )

  useEffect(() => {
    if (list) {
      const parsedAttrib = list.attrib || {}

      // get the data for all attrib fields (list-scoped and passed attributes)
      const allAttribFields = [...listScopedAttributes, ...attributes]
      const attribFieldValues = allAttribFields.reduce((acc, { name }) => {
        const fieldValue = (parsedAttrib as Record<string, any>)[name]
        // Default to empty string for all attrib fields
        acc[name] = fieldValue || ''
        return acc
      }, {} as Record<string, any>)

      setForm({
        label: list?.label || '',
        tags: list?.tags || [],
        active: list?.active ?? false,
        ...attribFieldValues,
      })
    }
  }, [list, JSON.stringify(attributes), JSON.stringify(listScopedAttributes)])

  const [updateList] = useUpdateEntityListMutation()

  const isAttribField = (fieldName: string): boolean => {
    return (
      attributes.some((attr) => attr.name === fieldName) ||
      listScopedAttributes.some((attr) => attr.name === fieldName)
    )
  }

  const handleChange = useCallback(
    async (key: string, value: any) => {
      if (!list?.id) return console.warn('No list ID provided')

      let updatePayload: any

      if (isAttribField(key)) {
        const currentAttrib = list.attrib || {}

        // If the value is empty string for category, set it to null to clear it
        if (value === '' && key === 'category') {
          updatePayload = {
            attrib: {
              ...currentAttrib,
              [key]: null,
            },
          }
        } else {
          updatePayload = {
            attrib: {
              ...currentAttrib,
              [key]: value,
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
        toast.error('Failed to update list attribute: ', error.attrib.detail)
      }
    },
    [list?.id, list?.attrib, projectName, updateList, listScopedAttributes, attributes],
  )

  return (
    <DetailsPanelAttributesEditor
      enableEditing={canEdit}
      fields={fields}
      form={form}
      isLoading={isLoading}
      onChange={handleChange}
      title="Attributes"
    />
  )
}
