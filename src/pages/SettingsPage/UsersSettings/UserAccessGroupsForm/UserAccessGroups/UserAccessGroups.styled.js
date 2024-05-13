import styled from 'styled-components'

export const Header = styled.header`
  display: flex;
  padding: 4px 4px 4px 8px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
`
export const AccessGroupItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  border-radius: var(--border-radius-m);
  cursor: pointer;
  user-select: none;

  /* text overflow */
  .name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &.active {
    &:hover {
      background-color: var(--md-sys-color-surface-container-hover);
    }
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);

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
