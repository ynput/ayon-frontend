import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { TextWidgetInput } from './TextWidgetInput'
import { WidgetBaseProps } from './CellWidget'
import styled from 'styled-components'
import { AttributeData } from '../types'
import { AttributeEnumItem } from '@shared/api'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { parseHtmlToPlainTextWithLinks } from '@shared/util'
import { TextEditingDialog } from './TextEditingDialog'
import { TextContentWidget } from './TextContentWidget'
import { useCellEditing as useCellEditingOriginal } from '../context/CellEditingContext'

const HOVER_PREVIEW_DELAY_MS = 900

export const StyledBaseTextWidget = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  display: flex;
  gap: 4px;

  &.markdown {
    margin-top: 18px;
    height: 40px;
  }
`

const StyledContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
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

// Allow usage outside of CellEditingProvider without crashing
const useSafeCellEditing = () => {
  try {
    return useCellEditingOriginal()
  } catch {
    return {
      isEditing: (_id: string) => false,
      setEditingCellId: (_id: string | null) => {},
    }
  }
}

export const TextWidget = forwardRef<HTMLSpanElement, TextWidgetProps>(
  (
    {
      value,
      option,
      isEditing,
      isInherited,
      onChange = () => {},
      onCancelEdit,
      style,
      type,
      columnId,
      cellId = '',
      isSelected = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [isHovered, setIsHovered] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const hoverTimerRef = useRef<number | null>(null)
    const { setEditingCellId } = useSafeCellEditing()

    const handleLinkClick = useCallback((e: React.MouseEvent, url: string) => {
      e.stopPropagation()
      window.open(url, '_blank', 'noopener,noreferrer')
    }, [])

    const openEditor = useCallback(() => {
      // Ensure the hover preview is closed before entering edit mode to avoid double dialogs
      setShowPreview(false)
      if (cellId) setEditingCellId(cellId)
    }, [cellId, setEditingCellId])

    const switchToPreview = useCallback(() => {
      onCancelEdit?.()
      setShowPreview(true)
    }, [onCancelEdit])

    // start 500ms timer on hover to show readonly preview
    useEffect(() => {
      if (isHovered && !isEditing) {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = window.setTimeout(() => {
          // Guard again at fire time to avoid showing during edit
          if (!isEditing && isHovered) {
            setShowPreview(true)
            // Notify others to close their previews so only one is open
            if (cellId) {
              window.dispatchEvent(
                new CustomEvent('projectTreeTextPreviewOpen', { detail: { cellId } }),
              )
            }
          }
        }, HOVER_PREVIEW_DELAY_MS)
      } else {
        console.log('clearing timeout', hoverTimerRef.current, isSelected)
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
        if (!isSelected) {
          setShowPreview(false)
        }
      }

      return () => {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
    }, [isHovered, isEditing, isSelected, cellId])

    // Listen for global preview open events to ensure only one preview is open at a time
    useEffect(() => {
      const handleOtherPreviewOpen = (e: Event) => {
        const custom = e as CustomEvent<{ cellId: string }>
        const otherId = custom.detail?.cellId
        if (!cellId || !otherId) return
        if (otherId !== cellId) {
          setShowPreview(false)
        }
      }
      window.addEventListener('projectTreeTextPreviewOpen', handleOtherPreviewOpen)
      return () => window.removeEventListener('projectTreeTextPreviewOpen', handleOtherPreviewOpen)
    }, [cellId])

    useEffect(() => {
      if (isEditing && showPreview) {
        setShowPreview(false)
      }
    }, [isEditing, showPreview])

    const input = (
      <TextWidgetInput
        value={value}
        onChange={onChange}
        onCancel={onCancelEdit}
        type={type || 'string'}
      />
    )

    const displayText = option?.label || value
    const textValue = typeof displayText === 'string' ? displayText : String(displayText || '')
    const isDescriptionColumn = columnId === 'attrib_description' || columnId === 'description'

    const renderContent = () => {
      if (isDescriptionColumn) {
        return (
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            allowedElements={['a']}
            unwrapDisallowed
            components={{
              a: ({ href, children }) => (
                <StyledLink
                  href={href || '#'}
                  onClick={(e) => href && handleLinkClick(e as unknown as React.MouseEvent, href)}
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
                onClick={(e) => handleLinkClick(e, part.href!)}
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
                onClick={(e) => handleLinkClick(e, part.content)}
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

    const combinedClassName = clsx(className, {
      markdown: isDescriptionColumn,
    })

    return (
      <>
        <StyledContainer
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={() => {
            if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
            hoverTimerRef.current = null
            // Timer cleared; preview state managed by hover effects
          }}
        >
          <StyledBaseTextWidget
            className={combinedClassName}
            style={{ color: option?.color, ...style }}
            {...props}
            ref={ref}
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
        </StyledContainer>

        {isEditing &&
          (isDescriptionColumn ? (
            <TextContentWidget
              value={value as string}
              cellId={cellId}
              isEditing={isEditing}
              onChange={onChange}
              onCancelEdit={onCancelEdit}
              onSwitchToPreview={switchToPreview}
            />
          ) : (
            <TextEditingDialog isEditing={isEditing} anchorId={cellId} onClose={onCancelEdit}>
              {input}
            </TextEditingDialog>
          ))}

        {showPreview && !isEditing && isDescriptionColumn && (
          <TextContentWidget
            value={value as string}
            cellId={cellId}
            isEditing={false}
            onChange={onChange}
            onCancelEdit={onCancelEdit}
            variant="preview"
            onPreviewClick={openEditor}
          />
        )}
      </>
    )
  },
)
