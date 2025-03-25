import styled from 'styled-components'
import { Body } from '../FolderBody/FolderBody.styled'
import { Button, theme } from '@ynput/ayon-react-components'

export const ParentBody = styled(Body)`
  & > * {
    ${theme.titleMedium}
    font-weight: 600;
  }
  gap: var(--base-gap-small) !important;
  display: flex;
`

export const ExpandButton = styled(Button)`
  color: var(--md-sys-color-outline);

  &:hover {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  &:active {
    background-color: var(--md-sys-color-surface-container-high-active);
  }

  .icon {
    transition: rotate 0.15s;
  }

  &.collapsed {
    .icon {
      rotate: -90deg;
    }
  }
`
