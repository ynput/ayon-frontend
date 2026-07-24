import { Icon } from '@ynput/ayon-react-components'
import { Fragment, forwardRef } from 'react'
import styled from 'styled-components'

const Value = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--base-gap-small);
  min-width: 0;
  .icon {
    font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 300, 'opsz' 20;
    font-size: 16px;
  }
`

const ValueText = styled.span`
  color: var(--md-sys-color-outline);
  font-size: 12px;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  span {
    font-size: inherit;
  }
`

interface FieldValueProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: string
  color?: string
  name: string
  items?: { label: string; color?: string }[]
}

export const FieldValue = forwardRef<HTMLDivElement, FieldValueProps>(
  ({ icon, color, name, items, ...props }, ref) => {
    return (
      <Value {...props} ref={ref}>
        {icon && <Icon icon={icon} style={{ color }} />}
        <ValueText title={name}>
          {items
            ? items.map((item, index) => (
                <Fragment key={index}>
                  <span style={{ color: item.color }}>{item.label}</span>
                  {index < items.length - 1 && ', '}
                </Fragment>
              ))
            : name}
        </ValueText>
      </Value>
    )
  },
)
