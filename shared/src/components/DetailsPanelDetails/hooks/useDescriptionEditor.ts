import { useState, useRef, useEffect } from 'react'

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
  const [editorValue, setEditorValue] = useState('')
  const editorRef = useRef<any>(null)



  useEffect(() => {
    if (isEditing) {
      // Use description directly as HTML instead of converting from markdown
      setEditorValue(description)
    }
  }, [description,, isEditing])

  // Autofocus editor when entering edit mode and place cursor at end
  useEffect(() => {
    if (!isEditing) return
    const quill = editorRef.current?.getEditor?.()
    // If Quill instance not ready yet, try on next frame
    if (!quill) {
      const id = requestAnimationFrame(() => {
        const q = editorRef.current?.getEditor?.()
        if (q) {
          q.focus()
          const len = q.getLength?.() ?? 0
          q.setSelection?.(len, 0)
        }
      })
      return () => cancelAnimationFrame(id)
    }
    quill.focus()
    const len = quill.getLength?.() ?? 0
    quill.setSelection?.(len, 0)
  }, [isEditing])

  const handleStartEditing = () => {
    if (enableEditing && !isMixed) {
      setIsEditing(true)
      // Use description directly as HTML instead of converting from markdown
      setEditorValue(description)
    }
  }

  const handleSave = () => {
    const quill = editorRef.current?.getEditor()
    if (quill) {
      const html = quill.root.innerHTML
      // Preserve React Quill HTML directly instead of converting to markdown
      onChange(html)
    }
    setIsEditing(false)
    setEditorValue('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditorValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave()
    }
  }

  return {
    isEditing,
    editorValue,
    setEditorValue,
    editorRef,
    handleStartEditing,
    handleSave,
    handleCancel,
    handleKeyDown,
  }
}
