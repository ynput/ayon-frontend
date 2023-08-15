import { Button as ayonButton } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'
import getShimmerStyles from '/src/styles/getShimmerStyles'

const buttonStyles = css`
  background-color: var(--md-sys-color-tertiary);
  color: var(--md-sys-color-on-tertiary);
  border-radius: var(--base-input-border-radius);
  padding: 8px 16px;
  max-height: unset;
  display: flex;
  flex-direction: column;

  &:hover {
    background-color: var(--md-sys-color-tertiary-hover);

    &:disabled {
      background-color: var(--md-sys-color-tertiary);
    }
  }

  &:disabled {
    opacity: 0.5;
  }
`

export const HeaderButton = styled(ayonButton)`
  position: relative;
  min-height: 50px;

  min-width: 210px;
  align-items: flex-start;

  ${buttonStyles}

  .icon {
    color: var(--md-sys-color-on-tertiary);
    font-size: 2rem;
    font-variation-settings: 'FILL' 1;
  }

  /* when loading show shimmer */
  ${({ $isLoading }) =>
    $isLoading &&
    css`
      ${getShimmerStyles('black', 'white')}
      opacity: 0.5;
      .status {
        visibility: hidden;
      }
    `}

  .more {
    transition: transform 0.3s ease;
  }
  ${({ $isOpen }) =>
    $isOpen &&
    css`
      .more {
        transform: rotate(180deg);
      }
    `}
`
export const Status = styled.div`
  display: flex;
  width: 100%;
  gap: 4px;
  align-items: center;
`

export const Container = styled.div`
  display: grid;
  flex-direction: column;
  align-items: center;
  background-color: var(--md-sys-color-tertiary-container);
  border-radius: var(--base-input-border-radius);
  gap: 0;
`

export const Dropdown = styled.div`
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
`

export const Footer = styled.footer`
  display: flex;
  gap: 4px;
  width: 100%;
`

export const Button = styled(ayonButton)`
  ${buttonStyles}
  flex: 1;
`
