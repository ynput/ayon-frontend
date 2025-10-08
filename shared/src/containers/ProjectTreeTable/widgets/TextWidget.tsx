import {
  MutableRefObject,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { TextWidgetInput } from './TextWidgetInput'
import { WidgetBaseProps, CellValue } from './CellWidget'
import styled from 'styled-components'
import { AttributeData } from '../types'
import { AttributeEnumItem } from '@shared/api'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { parseHtmlToPlainTextWithLinks } from '@shared/util'
import { CellEditingDialog } from '@shared/components/LinksManager/CellEditingDialog'
import { TextContentWidget } from './TextContentWidget'
import { useCellEditing as useCellEditingOriginal } from '../context/CellEditingContext'

const HOVER_PREVIEW_DELAY_MS = 600

export const StyledBaseTextWidget = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  width: 100%;
  min-width: 0;

  &.wrap-links {
    white-space: normal;
    flex-wrap: wrap;
  }
`

const StyledContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`

const InlineMarkdown = styled(Markdown)`
  display: contents;

  p {
    margin: 0;
    display: inline;
    white-space: pre-wrap;
  }

  &.wrap-links p {
    white-space: pre-wrap;
  }
`

const StyledLink = styled.a`
  color: var(--md-sys-color-primary, #0066cc);
  text-decoration: none;
  cursor: pointer;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;

  .wrap-links & {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    word-break: break-all;
    overflow-wrap: anywhere;
    flex-shrink: 1;
  }

  &:hover {
    text-decoration: underline;
  }
`

const StyledPreviewContent = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 16px;
  max-height: inherit;
  overflow-y: auto;
  cursor: text;
  color: var(--md-sys-color-on-surface, #1f1f1f);

  a {
    color: inherit;
  }
`

const StyledPreviewText = styled.div`
  flex: 1 1 auto;
  white-space: pre-wrap;
  word-break: break-word;

  span {
    white-space: inherit;
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
type ParsedTextPart = {
  type: 'text' | 'url'
  content: string
  key: number
  href?: string
}

const parseTextWithUrls = (text: string): ParsedTextPart[] => {
  // Regex to match HTTP/HTTPS URLs
  const urlRegex = /(https?:\/\/[^\s<>"]+[^\s.,!?;:<>\")\]])/gi
  const parts = text.split(urlRegex)

  return parts.map((part, index) => {
    if (isValidUrl(part)) {
      return { type: 'url', content: part, key: index, href: part }
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
      onChange: onChangeProp = () => {},
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
    const showPreviewRef = useRef(showPreview)
    const [isOverflowing, setIsOverflowing] = useState(false)
    const hoverTimerRef = useRef<number | null>(null)
    const previewCloseTimerRef = useRef<number | null>(null)
    const cellHoverRef = useRef(false)
    const previewHoverRef = useRef(false)
    const localSpanRef = useRef<HTMLSpanElement | null>(null)
    const [hoverTarget, setHoverTarget] = useState<HTMLTableCellElement | null>(null)
    const { setEditingCellId } = useSafeCellEditing()
    const normalizedType = (type ?? 'string') as TextWidgetType
    const isStringType = normalizedType === 'string'
    const [textDraftHtml, setTextDraftHtml] = useState<string | null>(null)
    const closingByScrollRef = useRef(false)
    const lastValueRef = useRef(value)

    const setPreviewVisible = useCallback(
      (next: boolean) => {
        showPreviewRef.current = next
        setShowPreview(next)
      },
      [setShowPreview],
    )

    const textValue = useMemo(() => {
      const displayText = option?.label || value
      return typeof displayText === 'string' ? displayText : String(displayText ?? '')
    }, [option?.label, value])
    const isDescriptionColumn = true
    const hasHtmlContent = useMemo(() => containsHtml(textValue), [textValue])
    const hasHtmlAnchor = useMemo(() => /<a\s/i.test(textValue), [textValue])
    const hasPlainUrl = useMemo(() => /(https?:\/\/\S+)/i.test(textValue), [textValue])
    const hasLink = hasHtmlAnchor || hasPlainUrl
    const shouldWrapLinks = hasLink && !isDescriptionColumn
    const plainTextParts = useMemo<ParsedTextPart[]>(() => {
      if (!textValue) return []
      if (hasHtmlContent) {
        return parseHtmlToPlainTextWithLinks(textValue) as ParsedTextPart[]
      }
      if (hasPlainUrl) {
        return parseTextWithUrls(textValue)
      }
      return [{ type: 'text', content: textValue, key: 0 }]
    }, [textValue, hasHtmlContent, hasPlainUrl])

    const setRefs = useCallback(
      (node: HTMLSpanElement | null) => {
        localSpanRef.current = node
        const td = (node?.closest('td') as HTMLTableCellElement | null) ?? null
        setHoverTarget((prev) => (prev === td ? prev : td))
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLSpanElement | null>).current = node
        }
      },
      [ref],
    )

    const handleLinkClick = useCallback((e: React.MouseEvent, url: string) => {
      e.stopPropagation()
      window.open(url, '_blank', 'noopener,noreferrer')
    }, [])
    const renderPlainContent = useCallback(
      (wrapLinks: boolean, isPreview = false) => {
        if (!plainTextParts.length) {
          return textValue
        }

        return plainTextParts.map((part) => {
          if (part.type === 'url') {
            const href = part.href || part.content
            return (
              <StyledLink
                key={`url-${part.key}`}
                href={href}
                onClick={(e) => handleLinkClick(e, href)}
                onMouseDown={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
              >
                {part.content}
              </StyledLink>
            )
          }

          return (
            <span
              key={`text-${part.key}`}
              style={{ whiteSpace: wrapLinks || isPreview ? 'pre-wrap' : 'pre-line' }}
            >
              {part.content}
            </span>
          )
        })
      },
      [plainTextParts, handleLinkClick, textValue],
    )

    const handleDraftChange = useCallback((nextDraft: string | null) => {
      setTextDraftHtml((prev) => (prev === nextDraft ? prev : nextDraft))
    }, [])

    const handleDialogDismiss = useCallback(() => {
      closingByScrollRef.current = true
    }, [])

    const clearPreviewCloseTimer = useCallback(() => {
      if (previewCloseTimerRef.current) {
        window.clearTimeout(previewCloseTimerRef.current)
        previewCloseTimerRef.current = null
      }
    }, [])

    const closePreviewIfAllowed = useCallback(() => {
      if (cellHoverRef.current || previewHoverRef.current) return
      if (!showPreviewRef.current) return
      setPreviewVisible(false)
    }, [setPreviewVisible])

    const schedulePreviewClose = useCallback(() => {
      if (!showPreviewRef.current) return
      clearPreviewCloseTimer()
      previewCloseTimerRef.current = window.setTimeout(() => {
        closePreviewIfAllowed()
      }, 150)
    }, [clearPreviewCloseTimer, closePreviewIfAllowed])

    const handlePreviewMouseEnter = useCallback(() => {
      previewHoverRef.current = true
      clearPreviewCloseTimer()
    }, [clearPreviewCloseTimer])

    const handlePreviewMouseLeave = useCallback(() => {
      previewHoverRef.current = false
      schedulePreviewClose()
    }, [schedulePreviewClose])

    useEffect(() => {
      if (!showPreview) {
        previewHoverRef.current = false
        clearPreviewCloseTimer()
      }
    }, [showPreview, clearPreviewCloseTimer])

    useEffect(() => {
      return () => {
        clearPreviewCloseTimer()
      }
    }, [clearPreviewCloseTimer])

    const handleCancelEditInternal = useCallback(() => {
      if (!closingByScrollRef.current) {
        handleDraftChange(null)
      }
      closingByScrollRef.current = false
      onCancelEdit?.()
    }, [handleDraftChange, onCancelEdit])

    const handleTextChange = useCallback(
      (newValue: CellValue | CellValue[], key?: 'Enter' | 'Click' | 'Escape') => {
        closingByScrollRef.current = false
        handleDraftChange(null)
        onChangeProp(newValue, key)
      },
      [handleDraftChange, onChangeProp],
    )

    useEffect(() => {
      if (lastValueRef.current !== value) {
        lastValueRef.current = value
        if (!isEditing) {
          handleDraftChange(null)
        }
      }
    }, [handleDraftChange, isEditing, value])

    const openEditor = useCallback(() => {
      // Ensure the hover preview is closed before entering edit mode to avoid double dialogs
      setPreviewVisible(false)
      if (cellId) setEditingCellId(cellId)
    }, [cellId, setEditingCellId, setPreviewVisible])

    // Removed switchToPreview: Escape should close edit dialog instead of opening preview

    const handlePreviewClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()
        const target = e.target as HTMLElement
        if (target.closest('a')) return
        openEditor()
      },
      [openEditor],
    )

    const handleDialogClose = useCallback(() => {
      if (isEditing) {
        handleCancelEditInternal()
      } else {
        setPreviewVisible(false)
      }
    }, [handleCancelEditInternal, isEditing, setPreviewVisible])

    const updateOverflowState = useCallback(() => {
      if (shouldWrapLinks) {
        setIsOverflowing(false)
        return
      }

      const el = localSpanRef.current
      if (!el) return

      const horizontalOverflow = el.scrollWidth - el.clientWidth > 1
      const verticalOverflow =
        isDescriptionColumn && el.scrollHeight - el.clientHeight > 1
      const hasOverflow = horizontalOverflow || verticalOverflow

      setIsOverflowing((prev) => (prev !== hasOverflow ? hasOverflow : prev))
    }, [isDescriptionColumn, shouldWrapLinks])

    useEffect(() => {
      updateOverflowState()
    }, [textValue, option?.label, isDescriptionColumn, updateOverflowState, shouldWrapLinks])

    useEffect(() => {
      if (!hoverTarget) return

      const handleMouseEnter = () => {
        cellHoverRef.current = true
        clearPreviewCloseTimer()
        setIsHovered(true)
      }
      const handleMouseLeave = () => {
        cellHoverRef.current = false
        setIsHovered(false)
        schedulePreviewClose()
      }
      const handleMouseDown = () => {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
        clearPreviewCloseTimer()
      }

      hoverTarget.addEventListener('mouseenter', handleMouseEnter)
      hoverTarget.addEventListener('mouseleave', handleMouseLeave)
      hoverTarget.addEventListener('mousedown', handleMouseDown)

      return () => {
        hoverTarget.removeEventListener('mouseenter', handleMouseEnter)
        hoverTarget.removeEventListener('mouseleave', handleMouseLeave)
        hoverTarget.removeEventListener('mousedown', handleMouseDown)
      }
    }, [hoverTarget, clearPreviewCloseTimer, schedulePreviewClose])

    useEffect(() => {
      const el = localSpanRef.current
      if (!el || typeof ResizeObserver === 'undefined') return

      let rafId = requestAnimationFrame(updateOverflowState)
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(updateOverflowState)
      })

      observer.observe(el)

      return () => {
        cancelAnimationFrame(rafId)
        observer.disconnect()
      }
    }, [updateOverflowState])

    useEffect(() => {
      if (!isOverflowing && showPreview) {
        setPreviewVisible(false)
      }
    }, [isOverflowing, showPreview, setPreviewVisible])

    // start 500ms timer on hover to show readonly preview
    useEffect(() => {
      if (!isStringType) {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
        if (showPreview) setPreviewVisible(false)
        return
      }

      if (shouldWrapLinks) {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
        if (showPreview) setPreviewVisible(false)
        return
      }

      if (isHovered && !isEditing && isOverflowing) {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = window.setTimeout(() => {
          // Guard again at fire time to avoid showing during edit
          if (!isEditing && isHovered && isOverflowing) {
            setPreviewVisible(true)
            // Notify others to close their previews so only one is open
            if (cellId) {
              window.dispatchEvent(
                new CustomEvent('projectTreeTextPreviewOpen', { detail: { cellId } }),
              )
            }
          }
        }, HOVER_PREVIEW_DELAY_MS)
      } else {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
        if (!isSelected || !isOverflowing) {
          setPreviewVisible(false)
        }
      }

      return () => {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
    }, [
      isHovered,
      isEditing,
      isSelected,
      isOverflowing,
      cellId,
      shouldWrapLinks,
      showPreview,
      isStringType,
      setPreviewVisible,
    ])

    // Listen for global preview open events to ensure only one preview is open at a time
    useEffect(() => {
      const handleOtherPreviewOpen = (e: Event) => {
        const custom = e as CustomEvent<{ cellId: string }>
        const otherId = custom.detail?.cellId
        if (!cellId || !otherId) return
        if (otherId !== cellId) {
          setPreviewVisible(false)
        }
      }
      window.addEventListener('projectTreeTextPreviewOpen', handleOtherPreviewOpen)
      return () => window.removeEventListener('projectTreeTextPreviewOpen', handleOtherPreviewOpen)
    }, [cellId, setPreviewVisible])

    useEffect(() => {
      if (isEditing && showPreview) {
        setPreviewVisible(false)
      }
    }, [isEditing, showPreview, setPreviewVisible])

    const input = (
      <TextWidgetInput
        value={value}
        onChange={handleTextChange}
        onCancel={handleCancelEditInternal}
        type={normalizedType}
      />
    )

    const renderContent = () => {
      if (isDescriptionColumn) {
        return (
          <InlineMarkdown
            className={clsx({ 'wrap-links': shouldWrapLinks })}
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
          </InlineMarkdown>
        )
      }

      return renderPlainContent(shouldWrapLinks)
    }

    const combinedClassName = clsx(className, {
      markdown: isDescriptionColumn,
      'wrap-links': shouldWrapLinks,
    })
    const showPlainPreview = showPreview && !isDescriptionColumn && isStringType
    const shouldShowPlainDialog = !isDescriptionColumn && (isEditing || showPlainPreview)

    return (
      <>
        <StyledContainer
        >
          <StyledBaseTextWidget
            className={combinedClassName}
            style={{ color: option?.color, ...style }}
            {...props}
            ref={setRefs}
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

        {shouldShowPlainDialog && (
          <CellEditingDialog
            isEditing={isEditing || showPlainPreview}
            anchorId={cellId || ''}
            onClose={handleDialogClose}
            closeOnOutsideClick={!isEditing && showPlainPreview}
          >
            {isEditing ? (
              input
            ) : (
              <StyledPreviewContent
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handlePreviewClick}
                onMouseEnter={handlePreviewMouseEnter}
                onMouseLeave={handlePreviewMouseLeave}
              >
                {option?.icon && (
                  <Icon
                    icon={option.icon}
                    style={{
                      color: option.color,
                      flexShrink: 0,
                    }}
                  />
                )}
                <StyledPreviewText className="wrap-links">{renderPlainContent(true, true)}</StyledPreviewText>
              </StyledPreviewContent>
            )}
          </CellEditingDialog>
        )}

        {isDescriptionColumn && (isEditing || showPreview) && (
          <TextContentWidget
            value={value as string}
            cellId={cellId}
            isEditing={isEditing}
            onChange={handleTextChange}
            onCancelEdit={handleCancelEditInternal}
            editingDraft={textDraftHtml}
            onEditingDraftChange={handleDraftChange}
            variant={showPreview && !isEditing ? 'preview' : 'edit'}
            onPreviewClick={openEditor}
            onDismissWithoutSave={handleDialogDismiss}
            onPreviewMouseEnter={handlePreviewMouseEnter}
            onPreviewMouseLeave={handlePreviewMouseLeave}
          />
        )}
      </>
    )
  },
)
