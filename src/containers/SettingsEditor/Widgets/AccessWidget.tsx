import { useState, useMemo } from 'react'
import { updateChangedKeys, parseContext } from '../helpers'
import { Button } from '@ynput/ayon-react-components'
import AccessEditorDialog, { AccessValues } from './AccessWidget/AccessEditorDialog'

// ...dialog moved to AccessEditorDialog.tsx

interface AccessWidgetProps {
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
      <Button
        onClick={() => {
          setIsOpen(true)
          console.log('Opening access editor')
        }}
        label="Edit Access"
        icon="lock"
      />
      {dialogComponent}
    </>
  )
}

export default AccessWidget
