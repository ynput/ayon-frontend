import { FC, useRef, useEffect, useCallback, useState } from 'react'
import styled from 'styled-components'

import { CellEditingDialog } from '@shared/components/LinksManager/CellEditingDialog'
import type { WidgetBaseProps } from './CellWidget'
import { StyledEditor } from '@shared/components/DetailsPanelDetails/DescriptionSection.styles'
import {
  MarkdownEditor,
  toggleBlockFormat,
  type BlockFormat,
  type MarkdownEditorHandle,
} from '@shared/components/MarkdownEditor'
import { toast } from 'react-toastify'

const StyledDialog = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--md-sys-color-surface-container-lowest);
  border-radius: 8px;
  min-width: 350px;
  width: 100%;
  max-width: 100%;
  height: auto;
  min-height: 88px;
  max-height: inherit;
  flex: 1;
  overflow: auto;
  border: 2px solid transparent;

  &.editing {
    border: 2px solid var(--md-sys-color-primary);
  }
`

const PlainTextarea = styled.textarea`
  width: 100%;
  height: auto;
  min-height: 88px;
  max-height: inherit;
  border: none;
  outline: none;
  resize: vertical;
  background: transparent;
  color: inherit;
  font: inherit;
  padding: 12px;
`

const PlainPreview = styled.div`
  width: 100%;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 12px;
  height: auto;
  min-height: 88px;
  max-height: inherit;
  overflow: auto;
`

// ctrl/cmd + key shortcuts for blocks in the rich text editor
const BLOCK_SHORTCUTS: Record<string, BlockFormat> = {
  d: 'code',
  o: 'number',
  l: 'bullet',
  h: 'h2',
}

export interface TextContentWidgetProps extends WidgetBaseProps {
  value?: string | number | null
  cellId: string
  placeholder?: string
  // When variant is 'preview', render the same UI read-only for hover preview
  variant?: 'edit' | 'preview'
  // When in preview, a click on the preview should enter edit mode
  onPreviewClick?: () => void
  // Enable or disable markdown editing features
  allowMarkdown?: boolean
  valueType?: 'string' | 'integer' | 'float'
  draftValue?: string | null
  onEditingDraftChange?: (value: string | null) => void
  onDismissWithoutSave?: () => void
  onPreviewMouseEnter?: () => void
  onPreviewMouseLeave?: () => void
}

export const TextContentWidget: FC<TextContentWidgetProps> = ({
  value,
  isEditing,
  cellId,
  onChange,
  onCancelEdit,
  variant = 'edit',
  onPreviewClick,
  allowMarkdown = true,
  valueType = 'string',
  draftValue,
  onEditingDraftChange,
  onDismissWithoutSave,
  onPreviewMouseEnter,
  onPreviewMouseLeave,
}) => {
  const hasDraftRef = useRef(draftValue != null)
  const normalizedValue = typeof value === 'string' ? value : value == null ? '' : String(value)
  // markdown (rich text) or plain text being edited, start with the value so the editor mounts with it
  const [editingValue, setEditingValue] = useState(draftValue ?? normalizedValue)
  const editorRef = useRef<MarkdownEditorHandle>(null)
  const isPreview = variant === 'preview'
  const isRichText = allowMarkdown
  const plainTextAreaRef = useRef<HTMLTextAreaElement>(null)
  const hasAutoFocusedRef = useRef(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const originalValueRef = useRef(normalizedValue)
  useEffect(() => {
    originalValueRef.current = normalizedValue
  }, [normalizedValue])

  const updateEditingValue = useCallback(
    (newValue: string) => {
      setEditingValue(newValue)
      onEditingDraftChange?.(newValue)
    },
    [onEditingDraftChange],
  )

  // Initialize the edited value for edit and preview
  useEffect(() => {
    if (hasDraftRef.current) {
      hasDraftRef.current = false
      return
    }
    if (!isEditing && !isPreview) return
    setEditingValue(normalizedValue)
  }, [isEditing, isPreview, normalizedValue])

  // Autofocus the plain text editor when the dialog opens (the rich text editor focuses itself)
  useEffect(() => {
    if (isPreview || !isEditing || isRichText) {
      hasAutoFocusedRef.current = false
      return
    }

    if (hasAutoFocusedRef.current) return

    requestAnimationFrame(() => {
      const textarea = plainTextAreaRef.current
      if (!textarea) return
      textarea.focus()
      const len = textarea.value.length
      // Position cursor at the end of the content
      textarea.setSelectionRange(len, len)
      hasAutoFocusedRef.current = true
    })
  }, [isEditing, isPreview, isRichText])

  const convertPlainValue = useCallback(
    (input: string): { value: string | number | null; error?: string } => {
      const trimmed = input.trim()

      if (valueType === 'string') {
        return { value: input }
      }

      if (trimmed === '') {
        return { value: null }
      }

      if (valueType === 'integer') {
        const intValue = parseInt(trimmed, 10)
        if (Number.isNaN(intValue)) {
          return { value: null, error: 'Invalid integer value. Please enter a valid integer.' }
        }
        return { value: intValue }
      }

      if (valueType === 'float') {
        const floatValue = parseFloat(trimmed)
        if (Number.isNaN(floatValue)) {
          return { value: null, error: 'Invalid number value. Please enter a valid number.' }
        }
        return { value: floatValue }
      }

      return { value: input }
    },
    [valueType],
  )

  // Save content function
  const handleSave = useCallback(
    (trigger: 'Click' | 'Enter' = 'Click') => {
      if (!isRichText) {
        const { value: convertedValue, error } = convertPlainValue(editingValue)
        if (error) {
          toast.error(error)
          return
        }
        // Avoid sending unchanged values unless triggered via Enter
        if (
          trigger !== 'Enter' &&
          (convertedValue === originalValueRef.current ||
            String(convertedValue ?? '') === originalValueRef.current)
        ) {
          onCancelEdit?.()
          return
        }
        onChange?.(convertedValue as string, trigger)
        return
      }
      const markdown = editorRef.current?.getMarkdown() ?? editingValue

      // Guard against saving unchanged content (e.g. click-outside before the editor initializes)
      if (trigger !== 'Enter' && markdown.trim() === originalValueRef.current.trim()) {
        onCancelEdit?.()
        return
      }

      onChange?.(markdown, trigger)
    },
    [convertPlainValue, editingValue, isRichText, onChange, onCancelEdit, onEditingDraftChange],
  )

  // Refs for capture-phase keyboard handler (avoids stale closures)
  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave
  const onCancelEditRef = useRef(onCancelEdit)
  onCancelEditRef.current = onCancelEdit

  // Capture-phase listener to intercept Enter/Escape before the editor processes them
  useEffect(() => {
    if (isPreview || !isRichText) return
    const el = dialogRef.current
    if (!el) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCancelEditRef.current?.()
        return
      }
      // Enter (without Shift) saves; Shift+Enter falls through for newline
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        handleSaveRef.current('Enter')
        return
      }
    }

    el.addEventListener('keydown', handler, true)
    return () => el.removeEventListener('keydown', handler, true)
  }, [isPreview, isRichText])

  // Handle Ctrl+key block formatting shortcuts (bold, italic... are handled by the editor)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isPreview || !isRichText || e.shiftKey || e.altKey) return
      if (!(e.ctrlKey || e.metaKey)) return
      const format = BLOCK_SHORTCUTS[e.key.toLowerCase()]
      const editor = editorRef.current?.getEditor()
      if (!format || !editor) return
      e.preventDefault()
      toggleBlockFormat(editor, format)
    },
    [isPreview, isRichText],
  )

  const dialogContent = (
    <StyledDialog
      ref={dialogRef}
      className={isPreview ? 'preview' : 'editing'}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
      onMouseEnter={() => {
        if (isPreview) onPreviewMouseEnter?.()
      }}
      onMouseLeave={() => {
        if (isPreview) onPreviewMouseLeave?.()
      }}
    >
      <StyledEditor
        onMouseDown={(e) => {
          // Always prevent selection issues with table beneath
          e.stopPropagation()
        }}
        onClick={(e) => {
          // Prevent bubbling to underlying cell in both modes
          e.stopPropagation()
          // In preview, allow clicking links; open editor only when clicking outside links
          if (isPreview) {
            const target = e.target as HTMLElement
            const isLink = !!target.closest('a')
            if (!isLink) onPreviewClick?.()
            return
          }
        }}
      >
        {isRichText ? (
          <MarkdownEditor
            key={`text-editor-${variant}-${isEditing}`}
            ref={editorRef}
            value={isPreview ? normalizedValue : editingValue}
            onChange={isPreview ? undefined : updateEditingValue}
            readOnly={isPreview}
            // formatting with shortcuts, a floating toolbar outside the dialog would close it
            toolbar={false}
            floatingToolbar={false}
            bordered={false}
            autoFocus={!isPreview}
            minHeight={64}
            placeholder=""
          />
        ) : isPreview ? (
          <PlainPreview>{normalizedValue}</PlainPreview>
        ) : (
          <PlainTextarea
            ref={plainTextAreaRef}
            value={editingValue}
            onChange={(e) => updateEditingValue(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                onCancelEdit?.()
                return
              }
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSave('Enter')
                return
              }
            }}
            spellCheck={false}
          />
        )}
      </StyledEditor>
    </StyledDialog>
  )

  return (
    <>
      {(isEditing || isPreview) && (
        <CellEditingDialog
          isEditing={Boolean(isEditing || isPreview)}
          anchorId={cellId}
          onClose={onCancelEdit}
          matchAnchorWidth
        >
          {dialogContent}
        </CellEditingDialog>
      )}
    </>
  )
}
