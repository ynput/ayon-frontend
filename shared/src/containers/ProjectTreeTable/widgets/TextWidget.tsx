import { forwardRef, useState, useEffect, useRef, useCallback } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { TextWidgetInput } from './TextWidgetInput'
import { WidgetBaseProps, EDIT_TRIGGER_CLASS } from './CellWidget'
import styled from 'styled-components'
import { AttributeData } from '../types'
import { AttributeEnumItem } from '@shared/api'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { parseHtmlToPlainTextWithLinks } from '@shared/util'
import { TextContentWidget } from './TextContentWidget'
import { CellEditingDialog } from '@shared/components/LinksManager/CellEditingDialog'
import { useCellEditing } from '../context/CellEditingContext'

// ── Styled components ──────────────────────────────────────────────

export const StyledBaseTextWidget = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;

  display: flex;
  gap: 4px;

  &.markdown {
    white-space: normal;
    word-break: break-word;
    display: block;
    overflow: hidden;
  }

  &.regular {
    display: block;
  }
`

const StyledLink = styled.a`
  color: var(--md-sys-color-primary, #0066cc);
  text-decoration: none;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`

const StyledPreviewContent = styled.div`
  background: var(--md-sys-color-surface-container-lowest);
  border-radius: 8px;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 40px;
  max-height: 500px;
  overflow: auto;
  border: 2px solid transparent;
  cursor: pointer;

  a {
    color: var(--md-sys-color-primary, #0066cc);
    text-decoration: none;
    white-space: normal;
    word-break: break-all;
    overflow-wrap: break-word;
    overflow: visible;
    text-overflow: unset;

    &:hover {
      text-decoration: underline;
    }
  }
`

// ── Preview delay controller (module singleton) ────────────────────

class PreviewDelayController {
  private lastShownTime = 0
  private warmTimeout = 500 // ms idle before resetting to cold mode
  private coldDelay = 600 // ms delay before first preview

  getDelay(): number {
    const elapsed = Date.now() - this.lastShownTime
    return elapsed < this.warmTimeout ? 0 : this.coldDelay
  }

  markShown(): void {
    this.lastShownTime = Date.now()
  }
}

const previewDelayController = new PreviewDelayController()

// Custom event dispatched when a preview opens (ensures single preview at a time)
const PREVIEW_OPEN_EVENT = 'projectTreeTextPreviewOpen'

// ── Helpers ────────────────────────────────────────────────────────

// Function to check if a string is a valid URL
const isValidUrl = (text: string): boolean => {
  try {
    const url = new URL(text.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Function to parse text and extract URLs
const parseTextWithUrls = (text: string) => {
  // Regex to match HTTP/HTTPS URLs
  const urlRegex = /(https?:\/\/[^\s<>"]+[^\s.,!?;:<>\")\]])/gi
  const parts = text.split(urlRegex)

  return parts.map((part, index) => {
    if (isValidUrl(part)) {
      return { type: 'url', content: part, key: index }
    }
    return { type: 'text', content: part, key: index }
  })
}

// Function to check if content contains HTML tags
const containsHtml = (text: string): boolean => {
  return /<[^>]*>/.test(text)
}

type AttributeType = AttributeData['type']
export type TextWidgetType = Extract<AttributeType, 'string' | 'integer' | 'float'>

export interface TextWidgetProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange'>,
    WidgetBaseProps {
  value: string
  option?: AttributeEnumItem
  isInherited?: boolean
  type?: TextWidgetType
  columnId?: string
  cellId?: string
  isSelected?: boolean
}

export const TextWidget = forwardRef<HTMLSpanElement, TextWidgetProps>(
  (
    {
      value,
      option,
      isEditing,
      isInherited,
      onChange,
      onCancelEdit,
      style,
      type,
      columnId,
      cellId,
      isSelected,
      className,
      ...props
    },
    ref,
  ) => {
    const { setEditingCellId } = useCellEditing()

    const [isHoveredOnCell, setIsHoveredOnCell] = useState(false)
    const [isHoveredOnPreview, setIsHoveredOnPreview] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [isOverflowing, setIsOverflowing] = useState(false)

    const textRef = useRef<HTMLSpanElement>(null)
    const isAnythingHovered = isHoveredOnCell || isHoveredOnPreview

    const displayText = option?.label || value
    const textValue = typeof displayText === 'string' ? displayText : String(displayText ?? '')
    const isDescriptionColumn = columnId === 'attrib_description' || columnId === 'description'
    // does the content contain only regular text?
    const isRegularText =
      !isDescriptionColumn && !containsHtml(textValue) && !textValue.match(/(https?:\/\/\S+)/gi)

    useEffect(() => {
      const el = textRef.current
      if (!el) return

      const checkOverflow = () => {
        if (isDescriptionColumn) {
          // Vertical overflow (text wraps but exceeds cell height)
          setIsOverflowing(el.scrollHeight > el.clientHeight + 1)
        } else {
          // Horizontal overflow (text is truncated with ellipsis)
          setIsOverflowing(el.scrollWidth > el.clientWidth + 1)
        }
      }

      const observer = new ResizeObserver(checkOverflow)
      observer.observe(el)
      checkOverflow()

      return () => observer.disconnect()
    }, [textValue, isDescriptionColumn])

    // ── Hover tracking on parent <td>
    useEffect(() => {
      const el = textRef.current
      if (!el) return

      const td = el.closest('td')
      if (!td) return

      const handleMouseEnter = () => setIsHoveredOnCell(true)
      const handleMouseLeave = () => setIsHoveredOnCell(false)

      td.addEventListener('mouseenter', handleMouseEnter)
      td.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        td.removeEventListener('mouseenter', handleMouseEnter)
        td.removeEventListener('mouseleave', handleMouseLeave)
      }
    }, [])

    // ── Preview show/hide logic
    useEffect(() => {
      // Close preview when editing starts
      if (isEditing) {
        setShowPreview(false)
        return
      }

      // Grace period before closing (handles cell→popup mouse transition)
      if (!isAnythingHovered) {
        if (showPreview) {
          const timer = setTimeout(() => setShowPreview(false), 100)
          return () => clearTimeout(timer)
        }
        return
      }

      // Don't show preview if text doesn't overflow or no cellId
      if (!isOverflowing || !cellId) return

      // Already showing, don't restart delay
      if (showPreview) return

      const delay = previewDelayController.getDelay()
      const timer = setTimeout(() => {
        setShowPreview(true)
        previewDelayController.markShown()
        // Signal other previews to close
        window.dispatchEvent(new CustomEvent(PREVIEW_OPEN_EVENT, { detail: { cellId } }))
      }, delay)

      return () => clearTimeout(timer)
    }, [isAnythingHovered, isOverflowing, isEditing, showPreview, cellId])

    // ── Listen for other previews opening → close this one ───────
    useEffect(() => {
      const handler = (e: Event) => {
        const detail = (e as CustomEvent).detail
        if (detail?.cellId !== cellId) {
          setShowPreview(false)
        }
      }

      window.addEventListener(PREVIEW_OPEN_EVENT, handler)
      return () => window.removeEventListener(PREVIEW_OPEN_EVENT, handler)
    }, [cellId])

    // ── Preview click → start editing
    const handlePreviewClick = useCallback(() => {
      setShowPreview(false)
      if (cellId) setEditingCellId(cellId)
    }, [cellId, setEditingCellId])

    // ── Render content
    const renderContent = () => {
      // For description columns, keep markdown rendering
      if (isDescriptionColumn) {
        return (
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              p: ({ children }) => <span>{children}</span>,
              a: ({ href, children }) => (
                <StyledLink
                  href={href || '#'}
                  onMouseDown={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </StyledLink>
              ),
            }}
          >
            {textValue}
          </Markdown>
        )
      }

      // Check if content contains HTML
      if (containsHtml(textValue)) {
        // Parse HTML to plain text with preserved links
        const parts = parseHtmlToPlainTextWithLinks(textValue)
        return parts.map((part) => {
          if (part.type === 'url' && part.href) {
            return (
              <StyledLink
                key={part.key}
                href={part.href}
                onMouseDown={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
              >
                {part.content}
              </StyledLink>
            )
          }
          return (
            <span key={part.key} style={{ whiteSpace: 'pre-line' }}>
              {part.content}
            </span>
          )
        })
      }

      // Check for URLs in plain text
      const hasUrls = textValue.match(/(https?:\/\/\S+)/gi)
      if (hasUrls) {
        // Text with URLs (handles both single URL and mixed content)
        const parts = parseTextWithUrls(textValue)
        return parts.map((part) => {
          if (part.type === 'url') {
            return (
              <StyledLink
                key={part.key}
                href={part.content}
                onMouseDown={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
              >
                {part.content}
              </StyledLink>
            )
          }
          return part.content
        })
      }

      // Regular text
      return textValue
    }

    // ── Non-description editing: inline TextWidgetInput
    if (isEditing && !isDescriptionColumn) {
      return (
        <TextWidgetInput
          value={value}
          onChange={onChange}
          onCancel={onCancelEdit}
          type={type || 'string'}
        />
      )
    }

    // ── Render: display content + any overlays ───────────────────
    const combinedClassName = clsx(className, {
      markdown: isDescriptionColumn,
      regular: isRegularText,
    })

    return (
      <>
        <StyledBaseTextWidget
          className={combinedClassName}
          style={{ color: option?.color, ...style }}
          {...props}
          ref={(node) => {
            // Merge external ref with internal ref
            ;(textRef as React.MutableRefObject<HTMLSpanElement | null>).current = node
            if (typeof ref === 'function') ref(node)
            else if (ref)
              (ref as React.MutableRefObject<HTMLSpanElement | null>).current = node
          }}
        >
          {option?.icon && (
            <Icon
              icon={option.icon}
              style={{
                color: option.color,
              }}
            />
          )}
          {renderContent()}
        </StyledBaseTextWidget>

        {/* Description column editing (Quill editor in popup) */}
        {isEditing && isDescriptionColumn && cellId && (
          <TextContentWidget
            value={value}
            cellId={cellId}
            isEditing={true}
            variant="edit"
            allowMarkdown={true}
            valueType={type || 'string'}
            onChange={onChange}
            onCancelEdit={onCancelEdit}
            onDismissWithoutSave={onCancelEdit}
          />
        )}

        {/* Description column hover preview (markdown in popup) */}
        {showPreview && !isEditing && isDescriptionColumn && cellId && (
          <TextContentWidget
            value={value}
            cellId={cellId}
            isEditing={true}
            variant="preview"
            allowMarkdown={true}
            onChange={onChange}
            onCancelEdit={onCancelEdit}
            onPreviewClick={handlePreviewClick}
            onPreviewMouseEnter={() => setIsHoveredOnPreview(true)}
            onPreviewMouseLeave={() => setIsHoveredOnPreview(false)}
          />
        )}

        {/* Non-description column hover preview (plain text in popup) */}
        {showPreview && !isEditing && !isDescriptionColumn && cellId && (
          <CellEditingDialog
            isEditing={true}
            anchorId={cellId}
            closeOnOutsideClick={false}
            closeOnScroll={false}
          >
            <StyledPreviewContent
              onClick={handlePreviewClick}
              onMouseEnter={() => setIsHoveredOnPreview(true)}
              onMouseLeave={() => setIsHoveredOnPreview(false)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {renderContent()}
            </StyledPreviewContent>
          </CellEditingDialog>
        )}
      </>
    )
  },
)
