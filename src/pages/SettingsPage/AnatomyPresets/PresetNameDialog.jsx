import React, { useRef, useEffect } from 'react'
import { Dialog, SaveButton, InputText } from '@ynput/ayon-react-components'

const PresetNameDialog = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder,
  initialValue = '',
  submitLabel = 'Save',
}) => {
  const [value, setValue] = React.useState(initialValue)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100)
    }
  }, [isOpen])

  const handleSave = () => {
    if (value.trim()) {
      onSubmit(value.trim())
    }
  }

  return (
    <Dialog
      header={title}
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <SaveButton
          label={submitLabel}
          onClick={handleSave}
          active={!!value.trim()}
          style={{ marginLeft: 'auto' }}
        />
      }
    >
      <InputText
        value={value}
        ref={inputRef}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%' }}
      />
    </Dialog>
  )
}

export default PresetNameDialog
