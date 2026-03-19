import { Icon, ShortcutTag } from '@ynput/ayon-react-components'
import React, { forwardRef } from 'react'
import * as Styled from './Menu.styled'
import { isArray } from 'lodash'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { usePowerpack } from '@shared/context'
import { MenuItemType } from './Menu'

export interface MenuItemProps extends Omit<React.HTMLAttributes<HTMLElement>, 'label'> {
  label?: string | string[]
  icon?: string
  img?: string
  highlighted?: boolean
  notification?: boolean
  selected?: boolean
  danger?: boolean
  items?: MenuItemType[]
  isLink?: string
  isDev?: boolean
  shortcut?: string
  disabled?: boolean
  powerFeature?: string
  active?: boolean
  target?: string
}

const MenuItem = forwardRef<HTMLLIElement, MenuItemProps>(
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
      powerFeature,
      active,
      ...props
    },
    ref,
  ) => {
    const labelsArray = isArray(label) ? label : [label]
    const { powerLicense } = usePowerpack()
    const isPowerFeature = !powerLicense && powerFeature

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
            power: isPowerFeature,
          },
          className,
        )}
        {...props}
        aria-label={labelsArray.join(', ')}
      >
        {(icon || isPowerFeature) && <Icon icon={isPowerFeature ? 'bolt' : icon!} />}
        {img && <Styled.Img src={img} alt={`${label} icon`} />}
        {labelsArray.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
        {shortcut && (
          <ShortcutTag style={{ minWidth: 22, textAlign: 'center' }} align={'right'}>
            {shortcut}
          </ShortcutTag>
        )}
        {active && <Icon icon="check" style={{ marginLeft: 'auto' }} />}

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
