import styled from 'styled-components'
import { ReactNode, CSSProperties } from 'react'

const hexToRgb = (hex: string): [number, number, number] => {
  const normalizedHex = hex.startsWith('#') ? hex.slice(1) : hex;

  if (normalizedHex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(normalizedHex)) {
    throw new Error(`Invalid hex color format: ${hex}`);
  }

  const bigint = parseInt(normalizedHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return [r, g, b];
};

const getTextColor = (backgroundColor: string, threshold: number = 160): string => {
  try {
    const [r, g, b] = hexToRgb(backgroundColor);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > threshold ? '#161616' : '#e0e0e0'; 

  } catch (error) { // variables for example
    return '#161616'; 
  }
};


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
