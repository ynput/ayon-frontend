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
  const displayTitle = data.title || name
  const tooltipText = showDetailedTooltip 
    ? `${data.title} (${name}) - ${data.description || 'No description available'}`
    : data.description || data.title || name

  return (
    <StyledFieldLabel 
      title={tooltipText}
      data-tooltip={showDetailedTooltip ? tooltipText : undefined}
    >
      {displayTitle}
    </StyledFieldLabel>
  )
}
