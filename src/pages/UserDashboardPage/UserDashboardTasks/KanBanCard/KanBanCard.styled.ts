import { DragOverlay } from '@dnd-kit/core'
import { EntityCard } from '@ynput/ayon-react-components'
import styled, { keyframes } from 'styled-components'

const topAnimation = (i: number) => keyframes`
  from {
    top: 0;
  }
  to {
    top: ${`calc((30px - 100%) * ${i})`};
  }
`
type KanBanEntityCardProps = {
  $index: number
}

export const KanBanEntityCard = styled(EntityCard)<KanBanEntityCardProps>`
  /* if we are dragging, hide description and rotate */
  &.overlay {
    cursor: grabbing;

    /* box shadow */
    box-shadow: 0 10px 5px 0px rgb(0 0 0 / 10%);

    .description {
      grid-template-rows: 0fr !important;
      padding-top: 0 !important;
    }

    animation: ${({ $index }) => topAnimation($index)} 100ms forwards;
  }
`

export const CardDragOverlay = styled(DragOverlay)`
  display: flex;
  flex-direction: column;

  gap: var(--base-gap-large);

  rotate: 5deg;
  /* box shadow */
  box-shadow: 0 0 20px 0px rgb(0 0 0 / 30%);

  /* remove box shadow from last child */
  & > *:last-child {
    box-shadow: none;
  }
`
