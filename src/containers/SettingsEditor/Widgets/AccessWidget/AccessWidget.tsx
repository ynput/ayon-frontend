import { useState, useMemo } from 'react'
import { updateChangedKeys, parseContext } from '../../helpers'
import AccessEditorDialog, { AccessOption, AccessValues } from './AccessEditorDialog'
import { AccessPreviewButton } from './AccessPreviewButton'

const CATEGORIES_ACCESS_ID = 'activity_categories'
const categoryAccessOptions: AccessOption[] = [
  { label: 'Viewer', value: 10, tooltip: 'Can view comments with this category.' },
  { label: 'Creator', value: 20, tooltip: 'Can create and view comments with this category.' },
  {
    label: 'Admin',
    value: 30,
    tooltip: 'Can create, view and delete comments with this category.',
  },
]

export interface AccessWidgetProps {
  formData?: AccessValues
  onChange: (value: AccessValues) => void
  formContext?: {
    headerProjectName?: string
  }
  idSchema?: { $id?: string }
  schema?: any
  uiSchema?: any
  id: string
}

const AccessWidget = (props: AccessWidgetProps) => {
  const { path } = parseContext(props)
  const projectName = props?.formContext?.headerProjectName || ''
  const isCategoriesAccess = props.id.includes(CATEGORIES_ACCESS_ID)

  const [value, setValue] = useState<AccessValues>(props.formData || {})
  const [isOpen, setIsOpen] = useState(false)

  const valueMap = useMemo(() => {
    if (!value) return []
    return Object.entries(value).map(([key, accessLevel]) => ({
      name: key,
      accessLevel,
    }))
  }, [value])

  const onDialogSubmit = (commitValue: AccessValues | null) => {
    console.log('Dialog submitted with value:', commitValue)
    if (commitValue === null) {
      setIsOpen(false)
      return
    }

    const isChanged = commitValue !== value
    setValue(commitValue)
    props.onChange(commitValue)
    setTimeout(() => {
      updateChangedKeys(props, isChanged, path)
    }, 100)
    setIsOpen(false)
  }

  return (
    <>
      <AccessPreviewButton value={valueMap} onClick={() => setIsOpen(true)} />
      {isOpen && (
        <AccessEditorDialog
          projectName={projectName}
          initialValue={value}
          onSubmit={onDialogSubmit}
          accessOptions={isCategoriesAccess ? categoryAccessOptions : undefined}
        />
      )}
    </>
  )
}

export default AccessWidget
