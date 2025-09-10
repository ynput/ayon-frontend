import { FC, useCallback, useEffect, useState } from 'react'
import { AttributeField, DetailsPanelAttributesEditor } from '../DetailsPanelAttributes'
import { EntityListModel, useGetProjectQuery, useUpdateEntityListMutation } from '@shared/api'
import { toast } from 'react-toastify'

interface ListAttributeFormProps {
  projectName: string
  list?: EntityListModel
  isLoading?: boolean
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

export const ListAttributeForm: FC<ListAttributeFormProps> = ({ projectName, list, isLoading }) => {
  const [form, setForm] = useState<ListFormData>({
    label: '',
    tags: [],
    active: false,
  })

  const { data: project } = useGetProjectQuery({ projectName })

  useEffect(() => {
    if (list) {
      setForm({
        label: list?.label || '',
        tags: list?.tags || [],
        active: list?.active ?? false,
      })
    }
  }, [list])

  const fields: AttributeField[] = [
    { name: 'label', data: { type: 'string', title: 'Label' } },
    {
      name: 'tags',
      data: {
        type: 'list_of_strings',
        title: 'Tags',
        enum: project?.tags?.map((t) => ({ value: t.name, label: t.name, color: t.color })),
      },
    },
    { name: 'active', data: { type: 'boolean', title: 'Active' } },
  ]

  const [updateList] = useUpdateEntityListMutation()

  const handleChange = useCallback(
    async (key: string, value: any) => {
      if (!list?.id) return console.warn('No list ID provided')
      const newValue = { [key]: value }
      // update the local form state immediately
      setForm((prev) => ({ ...prev, ...newValue }))
      // update the list in the database in the background
      try {
        await updateList({
          listId: list.id,
          projectName,
          entityListPatchModel: {
            ...newValue,
          },
        })
      } catch (error: any) {
        console.error(error)
        toast.error('Failed to update list attribute: ', error.data.detail)
      }
    },
    [list?.id, setForm],
  )

  return (
    <DetailsPanelAttributesEditor
      enableEditing
      fields={fields}
      form={form}
      isLoading={isLoading}
      onChange={handleChange}
    />
  )
}
