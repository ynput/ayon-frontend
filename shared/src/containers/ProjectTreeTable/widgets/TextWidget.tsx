import { forwardRef, useCallback } from 'react'
import { TextWidgetInput } from './TextWidgetInput'
import { WidgetBaseProps } from './CellWidget'
import styled from 'styled-components'
import { AttributeData } from '../types'
import { AttributeEnumItem } from '@shared/api'
import { Icon } from '@ynput/ayon-react-components'

const StyledBaseTextWidget = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  display: flex;
  gap: 4px;
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
  const urlRegex = /(https?:\/\/[^\s<>"]+[^\s.,!?;:<>\")\]])/gi;
  const parts = text.split(urlRegex)

  return parts.map((part, index) => {
    if (isValidUrl(part)) {
      return { type: 'url', content: part, key: index }
    }
    return { type: 'text', content: part, key: index }
  })
}

type AttributeType = AttributeData['type']
export type TextWidgetType = Extract<AttributeType, 'string' | 'integer' | 'float'>

export interface TextWidgetProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange'>,
    WidgetBaseProps {
  value: string
  option?: AttributeEnumItem
  isInherited?: boolean
}

export const TextWidget = forwardRef<HTMLSpanElement, TextWidgetProps>(
  ({ value, option, isEditing, isInherited, onChange, onCancelEdit, style, ...props }, ref) => {
    const handleLinkClick = useCallback((e: React.MouseEvent, url: string) => {
      e.stopPropagation()
      window.open(url, '_blank', 'noopener,noreferrer')
    }, [])

    if (isEditing) {
      return (
        <TextWidgetInput value={value} onChange={onChange} onCancel={onCancelEdit} type={'text'} />
      )
    }

    const displayText = option?.label || value
    const textValue = typeof displayText === 'string' ? displayText : String(displayText || '')
    const hasUrls = !option && textValue.match(/(https?:\/\/\S+)/gi)

    const renderContent = () => {
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
                target="_blank"
                rel="noopener noreferrer"
              >
                {part.content}
              </StyledLink>
            )
          }
          return part.content
        })
      } else {
        // Regular text
        return textValue
      }
    }

    return (
      <StyledBaseTextWidget style={{ color: option?.color, ...style }} {...props} ref={ref}>
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
