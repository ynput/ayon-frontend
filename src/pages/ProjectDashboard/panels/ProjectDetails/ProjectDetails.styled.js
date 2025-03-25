import styled from 'styled-components'
import { Toolbar } from '@ynput/ayon-react-components'

export const Code = styled.span`
  background-color: var(--md-sys-color-surface-container-lowest);
  padding: 2px 8px;
  border-radius: var(--border-radius-l);
`

export const Active = styled.span`
  background-color: var(--md-sys-color-surface-container-high);
  padding: 2px 4px;
  border-radius: 3px;

  display: flex;
  align-items: center;

  &.active {
    background-color: var(--md-sys-color-tertiary);
    color: var(--md-sys-color-on-tertiary);
  }
`

export const Header = styled(Toolbar)`
  button:not(.cancel) {
    width: 72px;
  }
`
