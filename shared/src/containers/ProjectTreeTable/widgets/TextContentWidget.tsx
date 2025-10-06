import { FC, useRef, useEffect, useCallback, useState, Suspense } from 'react'
import styled from 'styled-components'
import { TextEditingDialog } from './TextEditingDialog'
import type { WidgetBaseProps } from './CellWidget'
import ReactQuill from 'react-quill-ayon'
import InputMarkdownConvert from '@shared/containers/Feed/components/CommentInput/InputMarkdownConvert'
import { convertToMarkdown } from '@shared/containers/Feed/components/CommentInput/quillToMarkdown'
import { mentionTypeOptions } from '@shared/components/DetailsPanelDetails/hooks'
import { StyledEditor } from '@shared/components/DetailsPanelDetails/DescriptionSection.styles'
import { QuillListStyles } from '@shared/components/QuillListStyles'

const StyledDialog = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--md-sys-color-surface-container-lowest);
  border: 2px solid var(--md-sys-color-primary);
  border-radius: 8px;
  min-width: 500px;
  max-width: 800px;
  max-height: 400px;
`

const StyledHiddenMarkdown = styled.div`
  display: none;
`

export interface TextContentWidgetProps extends WidgetBaseProps {
  value: string
  cellId: string
  placeholder?: string
  // When variant is 'preview', render the same UI read-only for hover preview
  variant?: 'edit' | 'preview'
  // When in preview, a click on the preview should enter edit mode
  onPreviewClick?: () => void
}

export const TextContentWidget: FC<TextContentWidgetProps> = ({
  value,
  isEditing,
  cellId,
  onChange,
  onCancelEdit,
  variant = 'edit',
  onPreviewClick,
}) => {
  const [editingValue, setEditingValue] = useState('')
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const quillRef = useRef<any>(null)
  const markdownRef = useRef<HTMLDivElement>(null)
  const isPreview = variant === 'preview'

  // Detect platform/browser to avoid reserved shortcuts (e.g., Firefox on macOS)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
  const isFirefox = typeof navigator !== 'undefined' && /Firefox/i.test(navigator.userAgent)

  // Parse markdown to HTML to initialize the editor content for edit and preview
  useEffect(() => {
    if (!isEditing && !isPreview) return
    if (!value?.trim()) {
      setDescriptionHtml('')
      setEditingValue('')
      return
    }
    if (!markdownRef.current) return
    const html = markdownRef.current.innerHTML
    setDescriptionHtml(html)
    setEditingValue(html)
  }, [isEditing, isPreview, value])

  // Keep editing value in sync if source changes while open or in preview
  useEffect(() => {
    if (!isEditing && !isPreview) return
    if (descriptionHtml) setEditingValue(descriptionHtml)
  }, [isEditing, isPreview, descriptionHtml])

  // Autofocus editor when dialog opens
  useEffect(() => {
    if (isPreview) return
    if (isEditing && quillRef.current) {
      const quill = quillRef.current.getEditor()
      if (quill) {
        quill.focus()
        const len = quill.getLength()
        quill.setSelection(len, 0) // Place cursor at end
      }
    }
  }, [isEditing, isPreview])

  // Save content function
  const handleSave = useCallback(() => {
    if (!quillRef.current) return

    const quill = quillRef.current.getEditor()
    const html = quill.root.innerHTML
    const [markdown] = convertToMarkdown(html)
    onChange?.(markdown, 'Enter')
  }, [onChange])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isPreview) return
      if (!quillRef.current) return

      const quill = quillRef.current.getEditor()

      // Handle Ctrl/Cmd + key combinations
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase()

        // Normalize desired modifiers for code/list shortcuts across browsers
        const wantsAlt = isMac && isFirefox
        const wantsShift = !wantsAlt

        console.log('key', wantsShift, wantsAlt, e.ctrlKey)

        if (key === 'd') {
          e.preventDefault()
          quill.format('code-block', !quill.getFormat()['code-block'])
          return
        }

        if (key === 'o') {
          e.preventDefault()
          const format = quill.getFormat()
          quill.format('list', format.list === 'ordered' ? false : 'ordered')
          return
        }

        if (key === 'l') {
          e.preventDefault()
          const format = quill.getFormat()
          quill.format('list', format.list === 'bullet' ? false : 'bullet')
          return
        }

        switch (key) {
          case 'b':
            e.preventDefault()
            quill.format('bold', !quill.getFormat().bold)
            break
          case 'i':
            e.preventDefault()
            quill.format('italic', !quill.getFormat().italic)
            break
          case 'u':
            e.preventDefault()
            quill.format('underline', !quill.getFormat().underline)
            break
          case 'h':
            // Use Shift+Cmd/Ctrl+H to avoid macOS/app-level Cmd+H (Hide)
            e.preventDefault()
            const format = quill.getFormat()
            const isH2 = format.header === 2
            quill.format('header', isH2 ? false : 2)
            break
          case 'enter':
            e.preventDefault()
            handleSave()
            break
          case 'escape':
            e.preventDefault()
            onCancelEdit?.()
            break
        }
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSave()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancelEdit?.()
      }
    },
    [handleSave, onCancelEdit, isPreview],
  )

  const dialogContent = (
    <StyledDialog
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => {
        e.stopPropagation()
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
          <ReactQuill
            key={`text-editor-${variant}-${isEditing}`}
            ref={quillRef}
            theme="snow"
            value={editingValue}
            modules={{
              toolbar: false,
              // Disable keyboard bindings entirely in preview (readOnly)
              ...(isPreview
                ? {}
                : {
                    keyboard: {
                      bindings: {
                        bold: {
                          key: 'B',
                          shortKey: true,
                          handler: () => {
                            const quill = quillRef.current?.getEditor()
                            if (quill) quill.format('bold', !quill.getFormat().bold)
                          },
                        },
                        italic: {
                          key: 'I',
                          shortKey: true,
                          handler: () => {
                            const quill = quillRef.current?.getEditor()
                            if (quill) quill.format('italic', !quill.getFormat().italic)
                          },
                        },
                        underline: {
                          key: 'U',
                          shortKey: true,
                          handler: () => {
                            const quill = quillRef.current?.getEditor()
                            if (quill) quill.format('underline', !quill.getFormat().underline)
                          },
                        },
                        header2: {
                          key: 'H',
                          shortKey: true,
                          shiftKey: true,
                          handler: () => {
                            const quill = quillRef.current?.getEditor()
                            if (quill) {
                              const format = quill.getFormat()
                              const isH2 = format.header === 2
                              quill.format('header', isH2 ? false : 2)
                            }
                          },
                        },
                        blockquote: {
                          key: 'Q',
                          shortKey: true,
                          handler: () => {
                            const quill = quillRef.current?.getEditor()
                            if (quill) quill.format('blockquote', !quill.getFormat().blockquote)
                          },
                        },
                        'code-block': {
                          key: 'D',
                          shortKey: true,
                          ...(isMac && isFirefox ? { altKey: true } : { shiftKey: true }),
                          handler: () => {
                            const quill = quillRef.current?.getEditor()
                            if (quill) quill.format('code-block', !quill.getFormat()['code-block'])
                          },
                        },
                        'list-ordered': {
                          key: 'O',
                          shortKey: true,
                          ...(isMac && isFirefox ? { altKey: true } : { shiftKey: true }),
                          handler: () => {
                            console.log('list-ordered')
                            const quill = quillRef.current?.getEditor()
                            if (quill) {
                              const format = quill.getFormat()
                              quill.format('list', format.list === 'ordered' ? false : 'ordered')
                            }
                          },
                        },
                        'list-bullet': {
                          key: 'L',
                          shortKey: true,
                          ...(isMac && isFirefox ? { altKey: true } : { shiftKey: true }),
                          handler: () => {
                            const quill = quillRef.current?.getEditor()
                            if (quill) {
                              const format = quill.getFormat()
                              quill.format('list', format.list === 'bullet' ? false : 'bullet')
                            }
                          },
                        },
                      },
                    },
                  }),
            }}
            readOnly={isPreview}
            onChange={setEditingValue}
          />
        </QuillListStyles>
      </StyledEditor>
    </StyledDialog>
  )

  return (
    <>
      {/* Always render the hidden markdown component so markdownRef is available */}
      <StyledHiddenMarkdown
        className="markdown-content"
        data-cell-id={cellId}
        ref={markdownRef}
        style={{ display: 'none' }}
      >
        <Suspense fallback={null}>
          <InputMarkdownConvert typeOptions={mentionTypeOptions} initValue={value || ''} />
        </Suspense>
      </StyledHiddenMarkdown>

      {(isEditing || isPreview) && (
        <TextEditingDialog
          isEditing={isEditing ?? false}
          anchorId={cellId}
          onClose={onCancelEdit}
          variant={variant}
          onSave={handleSave}
        >
          {dialogContent}
        </TextEditingDialog>
      )}
    </>
  )
}
