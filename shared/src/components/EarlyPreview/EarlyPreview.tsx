import styled from 'styled-components'

const Message = styled.div`
  position: fixed;
  bottom: 14px;
  left: 14px;

  padding: var(--padding-m);
  border-radius: var(--border-radius-l);
  z-index: 1000;

  background-color: var(--md-sys-color-tertiary);
  color: var(--md-sys-color-on-tertiary);

  user-select: none;

  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  font-weight: 700;
`

import { forwardRef } from 'react'

interface EarlyPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  tooltip?: string
}

export const EarlyPreview = forwardRef<HTMLDivElement, EarlyPreviewProps>(
  ({ tooltip, ...props }, ref) => {
    return (
      <Message data-tooltip={tooltip} {...props} ref={ref}>
        Early preview
      </Message>
    )
  },
)
