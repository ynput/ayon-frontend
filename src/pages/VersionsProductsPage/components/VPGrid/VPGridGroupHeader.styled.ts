import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'

export const GroupWrapper = styled.div`
  background-color: var(--md-sys-color-surface-container-low);
  margin-bottom: 8px;
  position: sticky;
  top: 0;
  z-index: 100;
`

export const GroupHeader = styled.div`
  padding: 4px;
  cursor: pointer;
  user-select: none;
  border-radius: var(--border-radius-m);

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }

  /* Rotate expand icon when collapsed */
  &.collapsed .expand-icon {
    rotate: -90deg;
  }
`

export const Content = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  border-radius: var(--border-radius-m);

  .expand-icon {
    transition: rotate 200ms;
  }

  h2 {
    margin: 0;
    ${theme.titleMedium}
  }
`

export const Label = styled.h2`
  margin: 0;
  ${theme.titleMedium}
`

export const Count = styled.span`
  color: var(--md-sys-color-outline);
  ${theme.labelMedium}
`
