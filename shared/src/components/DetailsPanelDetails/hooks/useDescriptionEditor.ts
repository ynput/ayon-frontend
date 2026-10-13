import { useState } from 'react'

interface UseDescriptionEditorProps {
  description: string
  enableEditing: boolean
  isMixed: boolean
  onChange: (description: string) => void
}

export const useDescriptionEditor = ({
  description,
  enableEditing,
  isMixed,
  onChange,
}: UseDescriptionEditorProps) => {
  const [isEditing, setIsEditing] = useState(false)
  // markdown being edited
  const [editorValue, setEditorValue] = useState('')

  const handleStartEditing = () => {
    if (enableEditing && !isMixed) {
      setEditorValue(description || '')
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    onChange(editorValue)
    setIsEditing(false)
    setEditorValue('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditorValue('')
  }

  return {
    isEditing,
    editorValue,
    setEditorValue,
    handleStartEditing,
    handleSave,
    handleCancel,
  }
}
