import styled from 'styled-components'

const BadgeWrapper = styled.div`
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

const Badge = ({ children, hl, style, ...props }) => {
  const nstyle = { ...style }
  if (hl) {
    nstyle.backgroundColor = `var(--color-hl-${hl})`
  }

  return (
    <BaseBadge style={nstyle} {...props}>
      {children}
    </BaseBadge>
  )
}

export default Badge
export { BadgeWrapper, Badge }
