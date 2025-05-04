import React, { useRef } from 'react'
import * as Styled from './ActivityReference.styled'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { getEntityTypeIcon } from '../../../../util'

interface ActivityReferenceProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onMouseEnter'> {
  id: string
  type: string
  variant?: 'surface' | 'filled' | 'text'
  isEntity?: boolean
  disabled?: boolean
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>, pos: { left: number; top: number }) => void
}

const ActivityReference: React.FC<ActivityReferenceProps> = ({
  id,
  type,
  variant = 'surface',
  isEntity,
  disabled,
  onMouseEnter,
  children,
  ...props
}) => {
  const icon = type === 'user' ? 'alternate_email' : getEntityTypeIcon(type, 'link')
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const pos = { left: rect.x + rect.width / 2, top: rect.y }
    onMouseEnter?.(e, pos)
  }

  return (
    <Styled.Reference
      {...props}
      $variant={variant}
      ref={ref}
      onMouseEnter={handleMouseEnter}
      className={clsx({ disabled, isEntity }, 'reference')}
      id={`ref-${id}`}
    >
      <Icon icon={icon} />
      {children}
    </Styled.Reference>
  )
}

export default ActivityReference
