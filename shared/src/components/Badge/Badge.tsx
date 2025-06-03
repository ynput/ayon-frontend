import styled from 'styled-components'
import { ReactNode, CSSProperties } from 'react'

export const BadgeWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--base-gap-small);
  padding: 0 4px;
  margin-left: 12px;
`

const BaseBadge = styled.span`
  font-size: 0.8rem;
  border-radius: 4px;
  color: #161616;
  padding: 0 4px;
`

const WELL_KNOWN_BADGES = ['studio', 'project', 'producttion', 'staging', 'development']

interface BadgeProps {
  children?: ReactNode
  hl?: string
  style?: CSSProperties
  [key: string]: any
}

export const Badge = ({ children, hl, style, ...props }: BadgeProps) => {
  const nstyle: CSSProperties = { ...style }
  if (hl) {
    nstyle.backgroundColor = `var(--color-hl-${hl})`
  } else if (
    children &&
    typeof children === 'string' &&
    WELL_KNOWN_BADGES.includes(children.toLowerCase())
  ) {
    nstyle.backgroundColor = `var(--color-hl-${children.toLowerCase()})`
  }

  return (
    <BaseBadge style={nstyle} {...props}>
      {children}
    </BaseBadge>
  )
}
