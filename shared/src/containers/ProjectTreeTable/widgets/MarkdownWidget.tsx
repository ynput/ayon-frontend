import { FC, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import ReactQuill from 'react-quill-ayon'
import { Button, Dialog } from '@ynput/ayon-react-components'
import { WidgetBaseProps } from './CellWidget'
import { QuillListStyles } from '@shared/components/QuillListStyles'
import {
  StyledEditor,
  StyledQuillContainer,
  StyledHiddenMarkdown,
  StyledMarkdown,
} from '@shared/components/DetailsPanelDetails/DescriptionSection.styles'
import { DescriptionSection } from '@shared/components/DetailsPanelDetails'
import InputMarkdownConvert from '@shared/containers/Feed/components/CommentInput/InputMarkdownConvert'
import { convertToMarkdown } from '@shared/containers/Feed/components/CommentInput/quillToMarkdown'
import { mentionTypeOptions, useQuillFormats } from '@shared/components/DetailsPanelDetails/hooks'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import emoji from 'remark-emoji'
import remarkDirective from 'remark-directive'
import remarkDirectiveRehype from 'remark-directive-rehype'
import styled from 'styled-components'

const ExpandButton = styled(Button)`
  position: absolute;
  right: -40px;
  top: 38px;
  z-index: 100;
  width: 32px;
  height: 32px;
  padding: 2px;
`

const InnerMarkdown = styled.div`
  width: 100%;
  height: min-content;
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
`

interface MarkdownEditorDialogProps {
  value: string
  isOpen: boolean
  onClose: () => void
  onSave: (value: string) => void
}

const MarkdownEditorDialog: FC<MarkdownEditorDialogProps> = ({
  value,
  isOpen,
  onClose,
  onSave,
}) => {
  return (
    <Dialog
      header="Edit Description"
      size="lg"
      isOpen={isOpen}
      onClose={onClose}
      style={{ maxHeight: '80vh' }}
    >
      <DescriptionSection
        description={value}
        isLarge={true}
        isMixed={false}
        enableEditing={true}
        initialEdit={true}
        onChange={onSave}
        onCancel={onClose}
        isLoading={false}
      />
    </Dialog>
  )
}

export interface MarkdownWidgetProps extends WidgetBaseProps {
  value: string
  isReadOnly?: boolean
  onExpand?: () => void
  showExpand?: boolean
}

export const MarkdownWidget: FC<MarkdownWidgetProps> = ({
  value: initialValue,
  onChange,
  onCancelEdit,
  isEditing,
  isReadOnly,
  onExpand,
  showExpand,
}) => {
  const [editorValue, setEditorValue] = useState('')
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [width, setWidth] = useState(0)
  const [isExpandOpen, setIsExpandOpen] = useState(false)
  const markdownRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const conditionalFormats = useQuillFormats()

  const isActuallyEditing = isEditing && !isReadOnly

  useEffect(() => {
    if (!containerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  const { height, lines } = useMemo(() => {
    const valueToMeasure = isActuallyEditing ? convertToMarkdown(editorValue)[0] : initialValue
    if (!valueToMeasure) return { height: 32, lines: 0 }
    if (!width) return { height: 32, lines: 0 } // fallback or initial state

    const normalizedValue = valueToMeasure
      .replaceAll('\n\n', '[[DN]]')
      .replace(/\n(?!( *[-*+] )|( *\d+\. )|( {0,3}[#|>]))/g, '')
      .replaceAll('[[DN]]', '\n')

    // Estimate lines based on text and width
    // Assuming ~7px average char width for standard UI font at this scale
    const charWidth = 7
    const charsPerLine = Math.max(1, Math.floor((width - 7) / charWidth)) // 7px padding adjustment

    const lines = normalizedValue.split('\n').reduce((acc: number, line: string) => {
      return acc + Math.max(1, Math.ceil(line.length / charsPerLine))
    }, 0)

    if (lines <= 1) return { height: 32, lines }
    const calculatedHeight = 32 + (lines - 1) * 20
    return { height: Math.min(112, calculatedHeight), lines }
  }, [initialValue, width, isActuallyEditing, editorValue])

  // Convert markdown to HTML once on mount/value change
  useEffect(() => {
    if (!markdownRef.current) return
    const html = markdownRef.current.innerHTML
    setDescriptionHtml(html)
    if (!isActuallyEditing) {
      setEditorValue(html)
    }
  }, [initialValue])

  // Sync editor value when entering edit mode
  useEffect(() => {
    if (isActuallyEditing) {
      setEditorValue(descriptionHtml)
    }
  }, [isActuallyEditing, descriptionHtml])

  // Autofocus when editing
  useEffect(() => {
    if (isActuallyEditing && editorRef.current) {
      const quill = editorRef.current.getEditor()
      quill.focus()
      const len = quill.getLength()
      quill.setSelection(len, 0)
    }
  }, [isActuallyEditing])

  const handleSave = useCallback(() => {
    if (!editorRef.current) return
    const quill = editorRef.current.getEditor()
    const html = quill.root.innerHTML
    const [markdown] = convertToMarkdown(html)

    // Only save if content actually changed
    const currentMarkdown = markdown.trim()
    const previousMarkdown = (initialValue || '').trim()

    if (currentMarkdown !== previousMarkdown) {
      onChange(currentMarkdown)
    } else {
      onCancelEdit?.()
    }
  }, [onChange, onCancelEdit, initialValue])

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Check if the blur event is caused by clicking inside the editor (e.g. toolbar)
      if (editorRef.current) {
        const editorElement = editorRef.current.getEditingArea()
        // If the newly focused element is still within the editor, don't trigger save
        if (editorElement.contains(e.relatedTarget as Node)) {
          return
        }
      }
      // If it's the expand button, close but stop editing but don't save
      if (e.relatedTarget instanceof HTMLElement && e.relatedTarget.closest('.expand-button')) {
        onCancelEdit?.()
        return
      }
      handleSave()
    },
    [handleSave],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCancelEdit?.()
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        e.stopPropagation()
        handleSave()
      }
    },
    [handleSave, onCancelEdit],
  )

  const modules = {
    toolbar: false,
    magicUrl: true,
  }

  if (!initialValue && !isActuallyEditing) return null

  return (
    <div ref={containerRef} style={{ width: '100%', height, position: 'relative', minWidth: 0 }}>
      {showExpand && lines >= 3 && (
        <ExpandButton
          icon="expand_content"
          className="field-tools"
          variant="text"
          onClick={() => {
            setIsExpandOpen(true)
            onExpand?.()
          }}
        />
      )}
      {isActuallyEditing && !isExpandOpen ? (
        <StyledEditor
          style={{ height }}
          className="block-shortcuts compact"
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        >
          <QuillListStyles style={{ height }}>
            <StyledQuillContainer style={{ height }}>
              <ReactQuill
                ref={editorRef}
                theme="snow"
                value={editorValue}
                onChange={setEditorValue}
                modules={modules}
                formats={conditionalFormats}
              />
            </StyledQuillContainer>
          </QuillListStyles>
        </StyledEditor>
      ) : (
        <StyledMarkdown className="read-only" style={{ height, overflow: 'auto' }}>
          <InnerMarkdown className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, emoji, remarkDirective, remarkDirectiveRehype]}
              urlTransform={(url) => url}
            >
              {initialValue || ''}
            </ReactMarkdown>
          </InnerMarkdown>
        </StyledMarkdown>
      )}

      <StyledHiddenMarkdown ref={markdownRef}>
        <InputMarkdownConvert typeOptions={mentionTypeOptions} initValue={initialValue || ''} />
      </StyledHiddenMarkdown>

      <MarkdownEditorDialog
        isOpen={isExpandOpen}
        onClose={() => setIsExpandOpen(false)}
        value={editorValue || initialValue}
        onSave={(val) => {
          onChange(val)
          setIsExpandOpen(false)
        }}
      />
    </div>
  )
}
