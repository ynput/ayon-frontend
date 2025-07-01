import { Icon, ShortcutTag } from '@ynput/ayon-react-components'
import React, { forwardRef } from 'react'
import * as Styled from './Menu.styled'
import { isArray } from 'lodash'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const MenuItem = forwardRef(
  (
    {
      label,
      icon,
      img,
      highlighted,
      notification,
      selected,
      danger,
      items = [],
      className,
      isLink,
      isDev,
      shortcut,
      disabled,
      ...props
    },
    ref,
  ) => {
    const labelsArray = isArray(label) ? label : [label]

    const Item = (
      <Styled.Item
        ref={ref}
        className={clsx(
          'menu-item',
          {
            highlighted: highlighted,
            selected: selected,
            notification: notification,
            danger: danger,
            dev: isDev,
            disabled: disabled,
          },
          className,
        )}
        {...props}
        label={labelsArray.join(', ')}
      >
        {icon && <Icon icon={icon} />}
        {img && <Styled.Img src={img} alt={`${label} icon`} />}
        {labelsArray.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
        {shortcut && <ShortcutTag align={'right'}>{shortcut}</ShortcutTag>}
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
