import styled, { css, keyframes } from 'styled-components'
import AddonCard from './AddonCard'

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`

const AddonCardProgress = styled(AddonCard)`
  .icon {
    /* fill icon */
    ${({ $isFinished }) => ($isFinished ? 'font-variation-settings: "FILL" 1;' : '')}
  }

  &:before {
    z-index: 0;
    content: '';
    position: absolute;
    inset: 0;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 800ms;
    background-color: var(--md-sys-color-primary-container);
  }

  ${({ $isSyncing }) =>
    $isSyncing &&
    css`
      .icon {
        animation: ${spin} 1s linear infinite;
      }
    `}

  ${({ $progress }) => css`
    &:before {
      transform: scaleX(${$progress});
    }
  `}
`

export default AddonCardProgress
