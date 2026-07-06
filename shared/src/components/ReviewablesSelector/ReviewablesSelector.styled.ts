import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import PerfectScrollbar from 'react-perfect-scrollbar'

export const ReviewablesSelector = styled.div`
  position: relative;
  flex: 1;
  z-index: 1000;
  overflow: hidden;
  padding-bottom: var(--padding-m);
`

export const Scrollable = styled(PerfectScrollbar)`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  min-width: fit-content;
  gap: var(--base-gap-small);
`

export const ReviewableCard = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;

  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-high);
  border: solid 2px var(--md-sys-color-surface-container);
  padding: 2px;

  cursor: pointer;
  user-select: none;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);

    img {
      filter: brightness(1.1);
    }
  }

  .file-thumbnail {
    width: 100%;
    height: 62px;
    width: 62px;
    object-fit: cover;
    border-radius: var(--border-radius-m);
  }

  span {
    display: block;
    text-align: center;
  }

  --selection-background: var(--md-sys-color-primary-container);
  --selection-border-color: var(--md-sys-color-primary);
  --selection-color: var(--md-sys-color-on-primary-container);

  &.tertiary {
    --selection-background: var(--md-sys-color-tertiary-container);
    --selection-border-color: var(--md-sys-color-tertiary);
    --selection-color: var(--md-sys-color-on-tertiary-container);
  }

  &.selected {
    background-color: var(--selection-background);
    border-color: var(--selection-border-color);
    color: var(--selection-color);
  }
`

export const Label = styled.span`
  padding: var(--padding-m);
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline);
  min-width: max-content;

  position: absolute;
  left: -8px;
  transform: translateX(-100%) translateY(-50%);
  z-index: 1000;
`

export const AddButton = styled(Button)`
  width: 62px;
  min-height: 62px;
  background-color: var(--md-sys-color-surface-container-high);

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }
`

export const Tag = styled.div`
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);
  position: absolute;
  top: var(--padding-s);
  right: var(--padding-s);
  padding: var(--padding-s);
`
