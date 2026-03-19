import { FullScreen } from 'react-full-screen'
import styled from 'styled-components'

export const Container = styled.div`
  display: grid;
  overflow: hidden;
  height: 100%;
  width: 100%;
  gap: var(--base-gap-small);
  &:not(.minimized) {
    grid-template-columns: 1fr auto auto;
    grid-template-rows: auto minmax(0, 1fr);
  }
  .close {
    width: fit-content;
  }
  .details {
    width: fit-content;

    &.active {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
  }

  /* Layout when minimized - 3 columns with toolbar */
  &.minimized {
    display: flex;
    flex-direction: column;

    .related-tasks,
    .trackbar-row,
    .controls-row {
      display: none;
    }
  }

  /* when there is related panel, details panel height full */
  &:has(.related-tasks) {
    .viewer-details-panel {
      grid-row: span 2;
    }
  }
`

export const MinimizedToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  /* When minimized (no PathDisplay), push ButtonGroup to the right */
  &.minimized {
    justify-content: flex-end;
  }
`

export const PathDisplay = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--md-sys-color-on-surface);
  background-color: var(--md-sys-color-surface-container);
  border-radius: var(--border-radius-m);
  padding: var(--padding-s) var(--padding-m);
`
export const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  justify-self: end;
  align-self: flex-end;

  /* When standalone (not minimized), position at top-right */
  &.standalone {
    justify-self: end;
  }
`

export const PlayerToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  grid-column: span 2;
  gap: var(--base-gap-small);

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
  overflow: hidden;
`

export const Image = styled.img`
  width: 100%;
  height: 100%;
  display: block;
`

export const ViewerDetailsPanelWrapper = styled.div`
  height: 100%;
  max-height: 100%;
  max-width: clamp(460px, 25vw, 600px);
  min-width: clamp(460px, 25vw, 600px);
  position: relative;
  z-index: 1300;
`

export const EmptyPlaceholderWrapper = styled.div`
  padding-top: '160px';
  height: '100%';
  width: '100%';
  max-width: '400px';
  display: 'flex';
  justify-content: 'center';
  align-items: 'center';
`

export const RightToolBar = styled.div`
  display: flex;
  flex-direction: column;
`
export const RightContainer = styled.div`
  display: flex;
`
