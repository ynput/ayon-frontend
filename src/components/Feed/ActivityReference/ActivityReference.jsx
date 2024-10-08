import { useRef } from 'react'
import * as Styled from './ActivityReference.styled'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import getEntityTypeIcon from '@helpers/getEntityTypeIcon'
import { usePiPWindow } from '@context/pip/PiPProvider'

// variants = filled, text

const ActivityReference = ({
  id,
  type,
  variant = 'surface',
  isEntity,
  disabled,
  onMouseEnter,
  ...props
}) => {
  const { pipWindow } = usePiPWindow()

  const icon = type === 'user' ? 'alternate_email' : getEntityTypeIcon(type, 'link')

  const ref = useRef(null)

  const handleMouseEnter = (e) => {
    // check we are not in a pip
    if (pipWindow) return

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
      className={clsx({ disabled, isEntity }, 'reference')}
      id={`ref-${id}`}
    >
      <Icon icon={icon} />
      {props.children}
    </Styled.Reference>
  )
}

export default ActivityReference
