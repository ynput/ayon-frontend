import { FC, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import ReactQuill from 'react-quill-ayon'
import { WidgetBaseProps } from './CellWidget'
import { QuillListStyles } from '@shared/components/QuillListStyles'
import {
  StyledEditor,
  StyledQuillContainer,
  StyledHiddenMarkdown,
  StyledMarkdown,
} from '@shared/components/DetailsPanelDetails/DescriptionSection.styles'
import InputMarkdownConvert from '@shared/containers/Feed/components/CommentInput/InputMarkdownConvert'
import { convertToMarkdown } from '@shared/containers/Feed/components/CommentInput/quillToMarkdown'
import { mentionTypeOptions, useQuillFormats } from '@shared/components/DetailsPanelDetails/hooks'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import emoji from 'remark-emoji'
import remarkDirective from 'remark-directive'
import remarkDirectiveRehype from 'remark-directive-rehype'

export interface MarkdownWidgetProps extends WidgetBaseProps {
  value: string
  isReadOnly?: boolean
}

export const MarkdownWidget: FC<MarkdownWidgetProps> = ({
  value: initialValue,
  onChange,
  onCancelEdit,
  isEditing,
  isReadOnly,
}) => {
  const [editorValue, setEditorValue] = useState('')
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [width, setWidth] = useState(0)
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

  const height = useMemo(() => {
    const valueToMeasure = isActuallyEditing ? convertToMarkdown(editorValue)[0] : initialValue
    if (!valueToMeasure) return 32
    if (!width) return 32 // fallback or initial state

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

    if (lines <= 1) return 32
    const calculatedHeight = 32 + (lines - 1) * 20
    return Math.min(112, calculatedHeight)
  }, [initialValue, width, isActuallyEditing, editorValue])

  // Parse the text to remove the first \n from each line
  const parsedValue = useMemo(() => {
    return (initialValue || '')
      .replaceAll('\n\n', '[[DN]]')
      .replace(/\n(?!( *[-*+] )|( *\d+\. )|( {0,3}[#|>]))/g, '')
      .replaceAll('[[DN]]', '\n')
  }, [initialValue])

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
        if (editorElement.contains(e.relatedTarget as Node)) {
          return
        }
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
    <div ref={containerRef} style={{ width: '100%', height }}>
      {isActuallyEditing ? (
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
          <div className="markdown-content" style={{ height: 'min-content', padding: '6px 4px' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, emoji, remarkDirective, remarkDirectiveRehype]}
              urlTransform={(url) => url}
            >
              {parsedValue}
            </ReactMarkdown>
          </div>
        </StyledMarkdown>
      )}

      <StyledHiddenMarkdown ref={markdownRef}>
        <InputMarkdownConvert typeOptions={mentionTypeOptions} initValue={initialValue || ''} />
      </StyledHiddenMarkdown>
    </div>
  )
}
