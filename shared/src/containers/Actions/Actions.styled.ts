import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Actions = styled.div`
  position: relative;
  width: fit-content;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  max-height: 32px;
  padding: 2px;

  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);
`

export const FeaturedAction = styled(Button)`
  padding: 4px;
  user-select: none;
  position: relative;
  background-color: unset;
  img {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }
`
