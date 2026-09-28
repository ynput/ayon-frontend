import { FC, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Button, Dialog } from '@ynput/ayon-react-components'
import { WidgetBaseProps } from './CellWidget'
import { StyledEditor } from '@shared/components/DetailsPanelDetails/DescriptionSection.styles'
import { DescriptionSection } from '@shared/components/DetailsPanelDetails/DescriptionSection'
import { MarkdownEditor, type MarkdownEditorHandle } from '@shared/components/MarkdownEditor'
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
  // markdown being edited
  const [editorValue, setEditorValue] = useState(initialValue || '')
  const [width, setWidth] = useState(0)
  const [isExpandOpen, setIsExpandOpen] = useState(false)
  const editorRef = useRef<MarkdownEditorHandle>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // start editing from the saved value
  useEffect(() => {
    if (isActuallyEditing) setEditorValue(initialValue || '')
  }, [isActuallyEditing])

  const { height, lines } = useMemo(() => {
    const valueToMeasure = isActuallyEditing ? editorValue : initialValue
    if (!valueToMeasure) return { height: 32, lines: 0 }
    if (!width) return { height: 32, lines: 0 } // fallback or initial state

    // every markdown line is a line in the editor, blank lines between paragraphs included
    const normalizedValue = valueToMeasure.replace(/\\\n/g, '\n')

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

  const handleSave = useCallback(() => {
    const markdown = (editorRef.current?.getMarkdown() ?? editorValue).trim()

    // Only save if content actually changed
    if (markdown !== (initialValue || '').trim()) {
      onChange(markdown)
    } else {
      onCancelEdit?.()
    }
  }, [onChange, onCancelEdit, initialValue, editorValue])

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      const next = e.relatedTarget as HTMLElement | null
      // still inside the editor, or in its formatting toolbar / link input
      if (next && (containerRef.current?.contains(next) || next.closest('.md-floating-toolbar'))) {
        return
      }
      // If it's the expand button, close but stop editing but don't save
      if (next?.closest('.expand-button')) {
        onCancelEdit?.()
        return
      }
      handleSave()
    },
    [handleSave, onCancelEdit],
  )

  // keep escape and save from reaching the table
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
      e.stopPropagation()
    }
  }, [])

  if (!initialValue && !isActuallyEditing) return null

  const isEditingInline = isActuallyEditing && !isExpandOpen

  return (
    <div ref={containerRef} style={{ width: '100%', height, position: 'relative', minWidth: 0 }}>
      {showExpand && lines >= 3 && (
        <ExpandButton
          icon="expand_content"
          className="field-tools expand-button"
          variant="text"
          onClick={() => {
            setIsExpandOpen(true)
            onExpand?.()
          }}
        />
      )}
      <StyledEditor
        style={{ height, overflow: 'auto' }}
        className="block-shortcuts compact"
        onBlur={isEditingInline ? handleBlur : undefined}
        onKeyDown={isEditingInline ? handleKeyDown : undefined}
      >
        {/* remount when editing starts so the caret lands at the end */}
        <MarkdownEditor
          key={isEditingInline ? 'edit' : 'view'}
          ref={editorRef}
          value={isEditingInline ? editorValue : initialValue || ''}
          onChange={isEditingInline ? setEditorValue : undefined}
          readOnly={!isEditingInline}
          toolbar={false}
          floatingToolbar={isEditingInline}
          bordered={false}
          autoFocus={isEditingInline}
          minHeight={height}
          onSubmit={isEditingInline ? handleSave : undefined}
          onEscape={isEditingInline ? () => onCancelEdit?.() : undefined}
          placeholder=""
        />
      </StyledEditor>

      <MarkdownEditorDialog
        isOpen={isExpandOpen}
        onClose={() => setIsExpandOpen(false)}
        value={isActuallyEditing ? editorValue : initialValue}
        onSave={(val) => {
          onChange(val)
          setIsExpandOpen(false)
        }}
      />
    </div>
  )
}
