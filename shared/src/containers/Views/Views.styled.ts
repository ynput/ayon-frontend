import { Button, Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const ViewsButton = styled(Icon)`
  padding: var(--padding-s);
  border-radius: var(--border-radius-m);
  margin: -4px 0;
  margin-right: -16px;
  margin-left: 8px;

  &:hover,
  &.open {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  &.active {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);

    &:hover,
    &.open {
      background-color: var(--md-sys-color-primary-hover);
    }
  }
`

export const ViewsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  padding: var(--padding-m);
  min-width: 240px;
  max-width: 800px;

  overflow: hidden;

  z-index: 910;

  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-l);
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
`
export const ViewsMenuDivider = styled.li`
  height: 1px;
  background-color: var(--md-sys-color-outline-variant);
  margin: 4px 0;
`

export const BaseViewsContainer = styled.div`
  margin-left: 6px;
`
export const ViewButton = styled(Button)`
  padding: 0 8px 0 4px !important;
  outline: 1px dashed var(--md-sys-color-outline);
  margin: 0 8px 4px 0;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  background-color:  var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-outline);
  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);

  }

  &.active {
    background: var(--md-sys-color-surface-container-highest);
    outline: 1px solid var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-on-surface);

    &:hover {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
  }

  &.powerpack-locked {
    .icon {
      color: var(--md-sys-color-tertiary);
      font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
    }
  }
`
