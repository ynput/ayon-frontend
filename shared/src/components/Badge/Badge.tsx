import styled from 'styled-components'
import { CSSProperties } from 'react'
import { getTextColor } from '@shared/util/getTextColor'

export const BadgeWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--base-gap-small);
  padding: 0 4px;
  margin-left: 12px;
`

const BaseBadge = styled.span`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-m);
  padding: 0px 4px;

  &.placeholder {
    color: var(--md-sys-color-outline);
  }
`

const WELL_KNOWN_BADGES = ['studio', 'project', 'production', 'staging', 'developer']

interface BadgeProps {
  label?: string
  color?: string
  style?: CSSProperties
  className?: string
  [key: string]: any
}

export const Badge = (props: BadgeProps) => {
  const { label, color, style, className, ...additionalProps } = props
  const nstyle: CSSProperties = { ...style }
  let backgroundColor = undefined

  if (color) {
    if (color.startsWith('#') || color.startsWith('rgb')) {
      backgroundColor = color
    } else if (WELL_KNOWN_BADGES.includes(color.toLowerCase())) {
      backgroundColor = `var(--color-hl-${color})`
    }
  } else if (label && WELL_KNOWN_BADGES.includes(label.toLowerCase())) {
    backgroundColor = `var(--color-hl-${label.toLowerCase()})`
  }
  const foregroundColor = backgroundColor ? getTextColor(backgroundColor) : '#e0e0e0'

  nstyle.backgroundColor = backgroundColor
  nstyle.color = foregroundColor

  if (backgroundColor) {
    nstyle.fontSize= '0.9rem';
  }

  return (
    <BaseBadge
      style={nstyle}
      className={className}
      aria-label={label}
      {...additionalProps}
    >
      {label}
    </BaseBadge>
  )
}
