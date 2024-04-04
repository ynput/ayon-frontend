import styled from 'styled-components'

export const Buttons = styled.header`
  display: flex;
  align-items: center;
  gap: 4px;

  button {
    flex: 1;
    padding: 4px;
  }
`

export const ProjectItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  border-radius: var(--border-radius-m);
  cursor: pointer;

  /* default styles (inactive) */
  color: var(--md-sys-color-outline);

  /* hide icon until hover or active */
  .icon {
    display: none;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);

    .icon {
      display: block;
    }
  }

  &.active {
    color: var(--md-sys-color-on-surface);

    .icon {
      display: block;
    }

    &:hover {
      background-color: var(--md-sys-color-surface-container-hover);
    }
  }

  &.disabled {
    opacity: 0.5;
    user-select: none;
    pointer-events: none;
    overflow: hidden;

    &:hover {
      background-color: transparent;
    }
  }
`

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  overflow: auto;
`
