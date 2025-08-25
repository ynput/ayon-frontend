import { useState, useRef, useEffect } from 'react'
import { Quill } from 'react-quill-ayon'
import { convertToMarkdown } from '@shared/containers/Feed/components/CommentInput/quillToMarkdown'

var Delta = Quill.import('delta')

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

  // Convert markdown to HTML for the editor
  const convertMarkdownToHtml = (markdown: string): string => {
    if (!markdown) return ''
    return markdown
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  }

  useEffect(() => {
    if (isEditing && description) {
      const html = convertMarkdownToHtml(description)
      setEditorValue(html)
    }
  }, [description, isEditing])

  const handleStartEditing = () => {
    if (enableEditing && !isMixed) {
      setIsEditing(true)
      const html = convertMarkdownToHtml(description)
      setEditorValue(html)
    }
  }

  const handleSave = () => {
    const quill = editorRef.current?.getEditor()
    if (quill) {
      const html = quill.root.innerHTML
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
