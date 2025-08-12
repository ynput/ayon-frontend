import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'

export const SectionHeader = styled.li`
  ${theme.labelSmall}
  color: var(--md-sys-color-outline);
  user-select: none;
  border-radius: var(--border-radius-m);
  height: 28px;
  padding: 0 8px;

  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  .spacer {
    flex: 1;
  }
  .icon {
    font-size: 18px;
    color: var(--md-sys-color-outline);
    display: none;
  }

  &:hover .icon {
    display: inline-flex;
  }
`
