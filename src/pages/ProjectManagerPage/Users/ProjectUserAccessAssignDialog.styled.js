import { Button as BaseButton} from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const ProjectItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  align-items: center;
  gap: var(--base-gap-large);
  align-self: stretch;
  border-radius: var(--border-radius-m);
  cursor: pointer;
  min-height: 32px;
  overflow: hidden;
  user-select: none;

  .icon {
    opacity: 0;
    user-select: none;
    &.mixed {
      opacity: 1;
    }
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
    .icon {
      opacity: 1;
    }
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    .icon {
      opacity: 1;
    }

    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);
    }
  }
`

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  overflow: auto;
`

export const Button = styled(BaseButton)`
&.all-selected {
  background-color: var(--md-sys-color-primary-container);
}
`