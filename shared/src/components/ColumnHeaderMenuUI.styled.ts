import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const ColumnMenuButton = styled(Button)<{ $isOpen: boolean }>`
  background-color: unset !important;
  z-index: 110;
  position: relative;
  padding: 2px;
  width: 24px;
  height: 24px;

  &.hasIcon {
    padding: 2px;
  }

  &:hover,
  &.active {
    background-color: var(--md-sys-color-surface-container-hover) !important;
  }

  ${({ $isOpen }) =>
    $isOpen &&
    `
    background-color: var(--md-sys-color-surface-container-hover) !important;
  `}
`
