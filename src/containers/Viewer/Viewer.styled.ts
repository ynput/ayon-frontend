import { Dropdown } from '@ynput/ayon-react-components'
import { FullScreen } from 'react-full-screen'
import styled from 'styled-components'

export const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  grid-template-rows: auto 1fr;

  height: 100%;
  width: 100%;
  gap: var(--base-gap-small);

  .close {
    width: fit-content;
    justify-self: end;
  }
`

export const PlayerToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .product-dropdown {
    width: unset;

    background-color: var(--md-sys-color-surface-container-highest);

    &:hover {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
  }
`

export const FullScreenWrapper = styled(FullScreen)`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--md-sys-color-surface-container);
  z-index: 1000;
`

export const Image = styled.img`
  min-width: 300px;
  min-height: 300px;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
`

export const ViewerDetailsPanelWrapper = styled.div`
  height: 100%;
  max-height: 100%;
  max-width: clamp(460px, 25vw, 600px);
  min-width: clamp(460px, 25vw, 600px);
  position: relative;
  z-index: 1000;
`
