import styled from 'styled-components'
import { CSSProperties } from 'react'
import { getTextColor } from '@ynput/ayon-react-components'

const BaseBadge = styled.span`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-m);
  /* the size of the status pills in the project tables */
  padding: 1px 6px;
  line-height: 20px;

  &.placeholder {
    color: var(--md-sys-color-outline);
  }
`

const WELL_KNOWN_BADGES = ['studio', 'project', 'production', 'staging', 'developer']
// these are darker in the light theme, so they take white text there
const THEMED_BADGES = ['developer']

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
  let wellKnown: string | undefined

  if (color) {
    if (color.startsWith('#') || color.startsWith('rgb')) {
      backgroundColor = color
    } else if (WELL_KNOWN_BADGES.includes(color.toLowerCase())) {
      wellKnown = color.toLowerCase()
      backgroundColor = `var(--color-hl-${color})`
    }
  } else if (label && WELL_KNOWN_BADGES.includes(label.toLowerCase())) {
    wellKnown = label.toLowerCase()
    backgroundColor = `var(--color-hl-${label.toLowerCase()})`
  }
  const foregroundColor = !backgroundColor
    ? 'light-dark(var(--md-sys-color-on-surface), #e0e0e0)'
    : wellKnown === 'production'
    ? 'var(--color-on-hl-production)'
    : wellKnown === 'staging'
    ? 'var(--color-on-hl-staging)'
    : wellKnown && THEMED_BADGES.includes(wellKnown)
    ? `light-dark(white, ${getTextColor(backgroundColor)})`
    : getTextColor(backgroundColor)

  nstyle.backgroundColor = backgroundColor
  nstyle.color = foregroundColor

  return (
    <BaseBadge style={nstyle} className={className} aria-label={label} {...additionalProps}>
      {label}
    </BaseBadge>
  )
}
