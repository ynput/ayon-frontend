import { Icon, getReadableColor } from '@ynput/ayon-react-components'
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
  colorLight?: string | null
  name: string
  items?: { label: string; color?: string; colorLight?: string | null }[]
  // a coloured value shows as a pill, like in the tables: filled for a status, tinted for others and for items
  pill?: PillStyle
}

export const FieldValue = forwardRef<HTMLDivElement, FieldValueProps>(
  ({ icon, color, colorLight, name, items, pill, ...props }, ref) => {
    if (pill && items?.some((item) => item.color)) {
      return (
        <Value {...props} ref={ref}>
          {items.map((item, index) => (
            <ValuePill key={index} variant="tinted" {...item} />
          ))}
        </Value>
      )
    }

    if (pill && color) {
      return (
        <Value {...props} ref={ref}>
          <ValuePill variant={pill} label={name} {...{ icon, color, colorLight }} />
        </Value>
      )
    }

    return (
      <Value {...props} ref={ref}>
        {icon && <Icon icon={icon} style={{ color: getReadableColor({ color, colorLight }) }} />}
        <ValueText title={name}>
          {items
            ? items.map((item, index) => (
                <Fragment key={index}>
                  <span style={{ color: getReadableColor(item) }}>{item.label}</span>
                  {index < items.length - 1 && ', '}
                </Fragment>
              ))
            : name}
        </ValueText>
      </Value>
    )
  },
)
