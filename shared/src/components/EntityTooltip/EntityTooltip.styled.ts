import { EntityCard } from '@ynput/ayon-react-components'
import styled, { keyframes } from 'styled-components'

const animateIn = keyframes`
from {
    opacity: 0.4;
    scale: 0.9;
} to {
    opacity: 1;
    scale: 1;
}
`

export const TooltipEntityCard = styled(EntityCard)`
  position: fixed;
  max-width: 220px;
  z-index: 9999;

  translate: -50% calc(-100% - 4px);
  transform-origin: bottom center;

  animation: ${animateIn} 100ms ease-out;

  /* path always open */
  .description {
    grid-template-rows: 1fr;
  }

  /* shadow */
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
`
