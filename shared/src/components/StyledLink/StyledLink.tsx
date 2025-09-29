import styled from 'styled-components'

export const StyledLink = styled.a`
  color: var(--md-sys-color-primary, #0066cc);
  text-decoration: none;
  cursor: pointer;
  margin-right: 4px;
  overflow: hidden;
  text-overflow: clip;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`

export default StyledLink


