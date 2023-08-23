import { Icon } from '@ynput/ayon-react-components'
import React, { forwardRef } from 'react'
import * as Styled from './Menu.styled'

const MenuItem = forwardRef(({ label, icon, highlighted, items = [], ...props }, ref) => {
  return (
    <Styled.Item
      ref={ref}
      className={highlighted ? 'highlighted' : undefined}
      icon={icon}
      {...props}
      label={label}
    >
      {icon && <Icon icon={icon} />}
      <span>{label}</span>
      {!!items.length && <Icon icon="arrow_right" className="more" />}
    </Styled.Item>
  )
})

MenuItem.displayName = 'MenuItem'

export default MenuItem
