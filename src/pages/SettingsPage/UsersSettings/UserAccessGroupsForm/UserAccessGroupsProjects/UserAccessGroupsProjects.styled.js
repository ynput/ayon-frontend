import styled from 'styled-components'

export const Header = styled.header`
  display: flex;
  padding: 4px 4px 4px 8px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
`
export const ProjectItem = styled.div`
  display: flex;
  padding: 4px 8px;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  border-radius: var(--border-radius-m);
  cursor: pointer;

  /* default styles (inactive) */
  color: var(--md-sys-color-outline);

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  &.active {
    color: var(--md-sys-color-on-surface);

    &:hover {
      background-color: var(--md-sys-color-surface-container-hover);
    }
  }

  &.disabled {
    opacity: 0.5;
    user-select: none;
    pointer-events: none;

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
