import { Icon } from '@ynput/ayon-react-components'
import React, { forwardRef } from 'react'
import * as Styled from './Menu.styled'
import { isArray } from 'lodash'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import ShortcutWidget from '@/components/ShortcutWidget/ShortcutWidget'

const MenuItem = forwardRef(
  (
    {
      label,
      icon,
      highlighted,
      notification,
      selected,
      danger,
      items = [],
      className,
      isLink,
      shortcut,
      ...props
    },
    ref,
  ) => {
    const labelsArray = isArray(label) ? label : [label]

    const Item = (
      <Styled.Item
        ref={ref}
        className={classNames(
          'menu-item',
          {
            highlighted: highlighted,
            selected: selected,
            notification: notification,
            danger: danger,
          },
          className,
        )}
        icon={icon}
        {...props}
        label={labelsArray.join(', ')}
      >
        {icon && <Icon icon={icon} />}
        {labelsArray.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
        {shortcut && <ShortcutWidget align={'right'}>{shortcut}</ShortcutWidget>}
        {!!items.length && <Icon icon="arrow_right" className="more" />}
      </Styled.Item>
    )

    if (isLink) {
      return (
        <Link to={isLink} target={props.target}>
          {Item}
        </Link>
      )
    } else {
      return Item
    }
  },
)

MenuItem.displayName = 'MenuItem'

export default MenuItem
