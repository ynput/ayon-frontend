import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Actions = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  position: relative;
`

export const FeaturedAction = styled(Button)`
  padding: 6px;
  user-select: none;
  position: relative;
  max-width: 32px;
  img {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }

  &.loading {
    .icon,
    img {
      opacity: 0;
    }
    opacity: 1;
    overflow: hidden;

    background-color: unset;
  }
`
