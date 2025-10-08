import { FC, useRef, useEffect, useCallback, useState, Suspense, type ChangeEvent } from 'react'
import styled from 'styled-components'
import { CellEditingDialog } from '@shared/components/LinksManager/CellEditingDialog'
import type { WidgetBaseProps } from './CellWidget'
import ReactQuill from 'react-quill-ayon'
import InputMarkdownConvert from '@shared/containers/Feed/components/CommentInput/InputMarkdownConvert'
import { convertToMarkdown } from '@shared/containers/Feed/components/CommentInput/quillToMarkdown'
import { mentionTypeOptions } from '@shared/components/DetailsPanelDetails/hooks'
import { StyledEditor } from '@shared/components/DetailsPanelDetails/DescriptionSection.styles'
import { QuillListStyles } from '@shared/components/QuillListStyles'
import { toast } from 'react-toastify'

const StyledDialog = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--md-sys-color-surface-container-lowest);
  border-radius: 8px;
  width: 350px;
  height: auto;
  min-height: 88px;
  max-height: 100%;
  overflow: auto;

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

const StyledHiddenMarkdown = styled.div`
  display: none;
`

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
  onEditingDraftChange,
  onDismissWithoutSave,
  onPreviewMouseEnter,
  onPreviewMouseLeave,
}) => {
  const [editingValue, setEditingValue] = useState('')
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const quillRef = useRef<any>(null)
  const markdownRef = useRef<HTMLDivElement>(null)
  const isPreview = variant === 'preview'
  const isRichText = allowMarkdown
  const plainTextAreaRef = useRef<HTMLTextAreaElement>(null)
  const hasAutoFocusedRef = useRef(false)
  const normalizedValue = typeof value === 'string' ? value : value == null ? '' : String(value)
  const originalValueRef = useRef(normalizedValue)
  useEffect(() => {
    originalValueRef.current = normalizedValue
  }, [normalizedValue])

  // Parse markdown to HTML to initialize the editor content for edit and preview
  useEffect(() => {
    if (!isEditing && !isPreview) return
    if (!isRichText) {
      setEditingValue(normalizedValue)
      return
    }
    if (!normalizedValue.trim()) {
      setDescriptionHtml('')
      setEditingValue('')
      return
    }
    if (!markdownRef.current) return
    const html = markdownRef.current.innerHTML
    setDescriptionHtml(html)
    setEditingValue(html)
  }, [isEditing, isPreview, normalizedValue, isRichText])

  useEffect(() => {
    if (!isEditing && !isPreview) return
    if (!isRichText) {
      setEditingValue(normalizedValue)
      return
    }
    if (descriptionHtml) setEditingValue(descriptionHtml)
  }, [isEditing, isPreview, descriptionHtml, normalizedValue, isRichText])

  // Autofocus editor when dialog opens
  useEffect(() => {
    if (isPreview || !isEditing) {
      hasAutoFocusedRef.current = false
      return
    }

    if (isRichText) {
      if (hasAutoFocusedRef.current) return
      const quillInstance = quillRef.current?.getEditor()
      if (!quillInstance) return

      requestAnimationFrame(() => {
        const len = quillInstance.getLength()
        const index = Math.max(len - 1, 0)
        quillInstance.focus()
        quillInstance.setSelection(index, 0)
      })
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
  }, [isEditing, isPreview, descriptionHtml, isRichText])

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
      if (!quillRef.current) return

      const quill = quillRef.current.getEditor()
      const html = quill.root.innerHTML
      const [markdown] = convertToMarkdown(html)
      onChange?.(markdown, trigger)
    },
    [convertPlainValue, editingValue, isRichText, onChange, onCancelEdit, onEditingDraftChange],
  )

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isPreview || !isRichText) return
      if (!quillRef.current) return

      const quill = quillRef.current.getEditor()
      // Handle Ctrl/Cmd + key combinations
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase()
        const format = quill.getFormat()
        const handledKeys = new Set(['d', 'o', 'l', 'b', 'i', 'u', 'h', 'enter', 'escape'])

        if (!handledKeys.has(key)) return

        e.preventDefault()

        switch (key) {
          case 'd':
            quill.format('code-block', !quill.getFormat()['code-block'])
            return
          case 'o':
            quill.format('list', format.list === 'ordered' ? false : 'ordered')
            return
          case 'l':
            quill.format('list', format.list === 'bullet' ? false : 'bullet')
            return
          case 'b':
            quill.format('bold', !quill.getFormat().bold)
            break
          case 'i':
            quill.format('italic', !quill.getFormat().italic)
            break
          case 'u':
            quill.format('underline', !quill.getFormat().underline)
            break
          case 'h':
            const isH2 = format.header === 2
            quill.format('header', isH2 ? false : 2)
            break
          case 'enter':
            handleSave('Enter')
            break
          case 'escape':
            onCancelEdit?.()
            break
        }
      }
    },
    [handleSave, isPreview, isRichText, onCancelEdit],
  )

  const dialogContent = (
    <StyledDialog
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
        <QuillListStyles>
          {isRichText ? (
            <ReactQuill
              key={`text-editor-${variant}-${isEditing}`}
              ref={quillRef}
              theme="snow"
              value={editingValue}
              modules={{
                toolbar: false,
              }}
              readOnly={isPreview}
              onChange={setEditingValue}
            />
          ) : isPreview ? (
            <PlainPreview>{normalizedValue}</PlainPreview>
          ) : (
            <PlainTextarea
              ref={plainTextAreaRef}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                  event.preventDefault()
                  handleSave('Enter')
                }
              }}
              spellCheck={false}
            />
          )}
        </QuillListStyles>
      </StyledEditor>
    </StyledDialog>
  )

  return (
    <>
      {/* Always render the hidden markdown component so markdownRef is available */}
      {isRichText && (
        <StyledHiddenMarkdown
          className="markdown-content"
          data-cell-id={cellId}
          ref={markdownRef}
          style={{ display: 'none' }}
        >
          <Suspense fallback={null}>
            <InputMarkdownConvert typeOptions={mentionTypeOptions} initValue={normalizedValue} />
          </Suspense>
        </StyledHiddenMarkdown>
      )}

      {(isEditing || isPreview) && (
        <CellEditingDialog
          isEditing={Boolean(isEditing || isPreview)}
          anchorId={cellId}
          onClose={isPreview ? undefined : onCancelEdit}
          onSave={isPreview ? undefined : () => handleSave('Click')}
          closeOnOutsideClick={isPreview ? false : true}
          closeOnScroll={!isPreview}
          onDismissWithoutSave={isPreview ? undefined : onDismissWithoutSave}
          className={isPreview ? 'text-editing-dialog preview' : 'text-editing-dialog editing'}
        >
          {dialogContent}
        </CellEditingDialog>
      )}
    </>
  )
}
