import styled, { css } from 'styled-components'
import getShimmerStyles from '@/styles/getShimmerStyles'
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

  ${({ $isActive }) =>
    $isActive &&
    css`
      background-color: var(--md-sys-color-tertiary);
      color: var(--md-sys-color-on-tertiary);
    `}

  ${({ $isLoading }) =>
    $isLoading &&
    css`
      color: transparent;
      background-color: unset;
      width: 100%;

      ${getShimmerStyles()}
    `}
`

export const Header = styled(Toolbar)`
  button:not(.cancel) {
    width: 72px;
  }
`
