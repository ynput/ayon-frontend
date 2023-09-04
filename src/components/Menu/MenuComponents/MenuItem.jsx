import { Icon } from '@ynput/ayon-react-components'
import React, { forwardRef } from 'react'
import * as Styled from './Menu.styled'
import { isArray } from 'lodash'

const MenuItem = forwardRef(
  ({ label, icon, highlighted, selected, items = [], className, ...props }, ref) => {
    const labelsArray = isArray(label) ? label : [label]

    return (
      <Styled.Item
        ref={ref}
        className={`menu-item ${highlighted ? 'highlighted' : ''} ${
          selected ? 'selected' : ''
        } ${className}`}
        icon={icon}
        {...props}
        label={labelsArray.join(', ')}
      >
        {icon && <Icon icon={icon} />}
        {labelsArray.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
        {!!items.length && <Icon icon="arrow_right" className="more" />}
      </Styled.Item>
    )
  },
)

MenuItem.displayName = 'MenuItem'

export default MenuItem
