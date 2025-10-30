import { forwardRef, useCallback } from 'react'
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

const StyledBaseTextWidget = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  display: flex;
  gap: 4px;

  &.markdown {
    margin-top: 18px;
    height: 40px;
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
      className,
      ...props
    },
    ref,
  ) => {
    const handleLinkClick = useCallback((e: React.MouseEvent, url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer')
    }, [])

    if (isEditing) {
      return (
        <TextWidgetInput
          value={value}
          onChange={onChange}
          onCancel={onCancelEdit}
          type={type || 'string'}
        />
      )
    }

    const displayText = option?.label || value
    const textValue = typeof displayText === 'string' ? displayText : String(displayText || '')
    const isDescriptionColumn = columnId === 'attrib_description' || columnId === 'description'
    // does the content contain only regular text?
    const isRegularText =
      !isDescriptionColumn && !containsHtml(textValue) && !textValue.match(/(https?:\/\/\S+)/gi)

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

    const combinedClassName = clsx(className, EDIT_TRIGGER_CLASS, {
      markdown: isDescriptionColumn,
      regular: isRegularText,
    })

    return (
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
    )
  },
)
