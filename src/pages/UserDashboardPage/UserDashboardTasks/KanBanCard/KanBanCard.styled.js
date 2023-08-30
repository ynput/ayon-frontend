import { EntityCard } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'

export const KanBanEntityCard = styled(EntityCard)`
  ${({ $isDragging }) =>
    $isDragging &&
    css`
      visibility: hidden;
    `}
  /* if we are dragging, hide description and rotate */
  ${({ $isOverlay }) =>
    $isOverlay &&
    css`
      /* box shadow */
      box-shadow: 0 0 20px 0px rgb(0 0 0 / 30%);
      rotate: 5deg;
      cursor: grabbing;

      .description {
        grid-template-rows: 0fr !important;
        padding-top: 0 !important;
      }
    `}
`
