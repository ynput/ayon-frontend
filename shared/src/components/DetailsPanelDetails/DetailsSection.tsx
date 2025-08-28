import React from 'react'
import styled from 'styled-components'
import { AttributeField } from '@shared/components'
import { copyToClipboard } from '@shared/util'
import { Button } from '@ynput/ayon-react-components'
import { BorderedSection } from './BorderedSection'

const StyledRow = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr 40px;
  gap: 0px;
  align-items: center;
  min-height: 37px;
  position: relative;

  .copy-icon {
    opacity: 0;
    transition: opacity 0.2s ease;

    &:hover {
      background-color: var(--md-sys-color-surface-container-low-hover);
    }
  }

  &:hover .copy-icon {
    opacity: 1;
  }
`

const StyledLabel = styled.div`
  color: var(--md-sys-color-on-surface-variant);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: 4px;
  font-size: 14px;
`

const StyledValue = styled.div`
  text-align: left;
  color: var(--md-sys-color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  justify-self: end;
  font-size: 14px;
  font-family: monospace;
  width: 100%;
`

const StyledShimmer = styled.div`
  height: 20px;
  background: var(--md-sys-color-surface-container-low);
  border-radius: 4px;
  animation: shimmer 1.5s infinite;

  @keyframes shimmer {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.5;
    }
  }
`

interface DetailsSectionProps {
  fields: AttributeField[]
  form: Record<string, any>
  mixedFields: string[]
  isLoading: boolean
}

export const DetailsSection: React.FC<DetailsSectionProps> = ({
  fields,
  form,
  mixedFields,
  isLoading,
}) => {
  const formatValue = (value: any, fieldName: string): string => {
    if (value === null || value === undefined) {
      return '-'
    }

    if (fieldName === 'createdAt' || fieldName === 'updatedAt') {
      try {
        return new Date(value).toLocaleString()
      } catch {
        return value.toString()
      }
    }

    if (fieldName === 'path') {
      return value.toString()
    }

    if (fieldName === 'entityType') {
      return value.toString().charAt(0).toUpperCase() + value.toString().slice(1)
    }

    return value.toString()
  }

  if (isLoading) {
    return (
      <BorderedSection title="Details">
        {Array.from({ length: 6 }).map((_, index) => (
          <StyledRow key={index}>
            <StyledShimmer style={{ width: '80px' }} />
            <StyledShimmer style={{ width: '120px', justifySelf: 'end' }} />
            <div style={{ width: '24px' }} />
          </StyledRow>
        ))}
      </BorderedSection>
    )
  }

  return (
    <BorderedSection title="Details">
      {fields
        .filter((field) => !field.hidden)
        .map((field) => {
          const fieldValue = form[field.name]
          const isMixed = mixedFields.includes(field.name)
          const displayValue = isMixed ? 'Multiple values' : formatValue(fieldValue, field.name)

          return (
            <StyledRow key={field.name}>
              <StyledLabel title={field.data.description || field.data.title || field.name}>
                {field.data.title || field.name}
              </StyledLabel>
              <StyledValue
                title={displayValue}
                style={{
                  color: isMixed
                    ? 'var(--md-sys-color-on-surface-variant)'
                    : 'var(--md-sys-color-on-surface)',
                  fontStyle: isMixed ? 'italic' : 'normal',
                }}
              >
                {displayValue}
              </StyledValue>
              <Button
                className="copy-icon"
                variant="text"
                icon="content_copy"
                onClick={(e) => {
                  e.stopPropagation()
                  const valueToDisplay =
                    fieldValue === null || fieldValue === undefined ? '' : fieldValue
                  copyToClipboard(valueToDisplay.toString(), true)
                }}
              />
            </StyledRow>
          )
        })}
    </BorderedSection>
  )
}
