import { Icon } from '@ynput/ayon-react-components'
import { Fragment, forwardRef } from 'react'
import styled from 'styled-components'
import { ValuePill } from '@shared/components/ValuePill'
import type { PillStyle } from '@shared/util/pillColors'

const Value = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--base-gap-small);
  min-width: 0;
  font-size: 12px;
  .icon {
    font-variation-settings: 'FILL' 1;
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
  // a coloured value is a pill, like in the tables: filled for a status, tinted (the default) for others
  // and for items; the colour is never the text colour
  pill?: PillStyle
}

export const FieldValue = forwardRef<HTMLDivElement, FieldValueProps>(
  ({ icon, color, name, items, pill, ...props }, ref) => {
    if (items?.some((item) => item.color)) {
      return (
        <Value {...props} ref={ref}>
          {items.map((item, index) => (
            <ValuePill key={index} variant="tinted" {...item} />
          ))}
        </Value>
      )
    }

    if (color) {
      return (
        <Value {...props} ref={ref}>
          <ValuePill variant={pill ?? 'tinted'} label={name} {...{ icon, color }} />
        </Value>
      )
    }

    return (
      <Value {...props} ref={ref}>
        {icon && <Icon icon={icon} />}
        <ValueText title={name}>
          {items
            ? items.map((item, index) => (
                <Fragment key={index}>
                  <span>{item.label}</span>
                  {index < items.length - 1 && ', '}
                </Fragment>
              ))
            : name}
        </ValueText>
      </Value>
    )
  },
)
