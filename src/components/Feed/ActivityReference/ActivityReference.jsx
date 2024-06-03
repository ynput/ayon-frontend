import { useRef } from 'react'
import * as Styled from './ActivityReference.styled'
import { Icon } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'
import getEntityTypeIcon from '/src/helpers/getEntityTypeIcon'

// variants = filled, text

const ActivityReference = ({
  type,
  variant = 'surface',
  isEntity,
  disabled,
  onMouseEnter,
  ...props
}) => {
  const icon = type === 'user' ? 'alternate_email' : getEntityTypeIcon(type, 'link')

  const ref = useRef(null)

  const handleMouseEnter = (e) => {
    // get the center of the reference
    const { x, y, width } = ref.current.getBoundingClientRect()
    const pos = { left: x + width / 2, top: y }

    onMouseEnter && onMouseEnter(e, pos)
  }

  return (
    <Styled.Reference
      {...props}
      variant={variant}
      icon={icon}
      $variant={variant}
      ref={ref}
      onMouseEnter={handleMouseEnter}
      className={classNames({ disabled, isEntity }, 'reference')}
    >
      <Icon icon={icon} />
      {props.children}
    </Styled.Reference>
  )
}

export default ActivityReference
