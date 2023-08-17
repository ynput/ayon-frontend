import { Button } from '@ynput/ayon-react-components'
import React from 'react'

const MenuItem = ({ label, icon, highlighted, ...props }) => {
  return (
    <Button
      variant={highlighted ? 'tonal' : 'text'}
      className={highlighted ? 'highlighted' : undefined}
      icon={icon}
      {...props}
      label={label}
    />
  )
}

export default MenuItem
