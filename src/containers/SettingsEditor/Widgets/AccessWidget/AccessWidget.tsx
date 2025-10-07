import { useState, useMemo } from 'react'
import { updateChangedKeys, parseContext } from '../../helpers'
import AccessEditorDialog, { AccessValues } from './AccessEditorDialog'
import { AccessPreviewButton } from './AccessPreviewButton'

export interface AccessWidgetProps {
  formData?: AccessValues
  onChange: (value: AccessValues) => void
  formContext?: {
    headerProjectName?: string
  }
  idSchema?: { $id?: string }
  schema?: any
  uiSchema?: any
}

const AccessWidget = (props: AccessWidgetProps) => {
  const { path } = parseContext(props)
  const projectName = props?.formContext?.headerProjectName || ''

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

  const dialogComponent = useMemo(() => {
    if (!isOpen) return null
    return (
      <AccessEditorDialog
        projectName={projectName}
        initialValue={value}
        onSubmit={onDialogSubmit}
      />
    )
  }, [value, isOpen, projectName, onDialogSubmit])

  return (
    <>
      <AccessPreviewButton value={valueMap} onClick={() => setIsOpen(true)} />
      {dialogComponent}
    </>
  )
}

export default AccessWidget
