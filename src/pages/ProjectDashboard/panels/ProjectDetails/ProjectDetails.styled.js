import styled, { css } from 'styled-components'
import getShimmerStyles from '/src/styles/getShimmerStyles'
import { Toolbar } from '@ynput/ayon-react-components'

export const Thumbnail = styled.div`
  width: 100%;
  height: auto;
  position: relative;
  aspect-ratio: 16 / 9;
  & > div {
    width: 100%;
    height: 100%;
    max-width: unset;
    aspect-ratio: unset;

    img {
      object-fit: cover;
    }
  }
`

export const Active = styled.span`
  background-color: var(--md-sys-color-surface-container-high);
  padding: 2px 4px;
  border-radius: 3px;
  position: absolute;
  top: 4px;
  right: 4px;
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
