import { humanizeField } from '@shared/util'
import React from 'react'
import styled from 'styled-components'

const StyledFieldLabel = styled.div`
  color: var(--md-sys-color-outline);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
`

interface FieldLabelProps {
  name: string
  data: {
    title?: string
    description?: string
  }
  showDetailedTooltip?: boolean
}

export const FieldLabel: React.FC<FieldLabelProps> = ({
  name,
  data,
  showDetailedTooltip = false,
}) => {
  const displayTitle = data.title ? humanizeField(data.title) : humanizeField(name)
  const tooltipText = showDetailedTooltip
    ? `${displayTitle} (${name}) ${data.description ? '-' : ''} ${data.description || ''}`
    : data.description || displayTitle

  return (
    <StyledFieldLabel data-tooltip={showDetailedTooltip ? tooltipText : undefined}>
      {displayTitle}
    </StyledFieldLabel>
  )
}
