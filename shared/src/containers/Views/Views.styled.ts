import { Icon } from '@ynput/ayon-react-components'
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
