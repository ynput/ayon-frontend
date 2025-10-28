import { useState, useRef, useEffect } from 'react'
import { convertToMarkdown } from '@shared/containers/Feed/components/CommentInput/quillToMarkdown'

interface UseDescriptionEditorProps {
  descriptionHtml: string
  enableEditing: boolean
  isMixed: boolean
  onChange: (description: string) => void
}

export const useDescriptionEditor = ({
  descriptionHtml,
  enableEditing,
  isMixed,
  onChange,
}: UseDescriptionEditorProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editorValue, setEditorValue] = useState('')
  const editorRef = useRef<any>(null)



  useEffect(() => {
    if (isEditing) {
      setEditorValue(descriptionHtml)
    }
  }, [descriptionHtml, isEditing])

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
      setEditorValue(descriptionHtml)
    }
  }

  const handleSave = () => {
    const quill = editorRef.current?.getEditor()
    if (quill) {
      const html = quill.root.innerHTML
      // Convert Quill HTML to Markdown for persistence
      const [markdown] = convertToMarkdown(html)
      onChange(markdown)
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
