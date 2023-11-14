import { Icon } from '@ynput/ayon-react-components'
import React, { forwardRef } from 'react'
import * as Styled from './Menu.styled'
import { isArray } from 'lodash'
import { Link } from 'react-router-dom'

const MenuItem = forwardRef(
  (
    { label, icon, highlighted, selected, items = [], className, isLink, shortcut, ...props },
    ref,
  ) => {
    const labelsArray = isArray(label) ? label : [label]

    const Item = (
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
        {shortcut && <Styled.Shortcut>{shortcut}</Styled.Shortcut>}
        {!!items.length && <Icon icon="arrow_right" className="more" />}
      </Styled.Item>
    )

    if (isLink) {
      return <Link to={isLink}>{Item}</Link>
    } else {
      return Item
    }
  },
)

MenuItem.displayName = 'MenuItem'

export default MenuItem
