import styled from 'styled-components'

// one grid for all rows, so the assignees and the status pills line up whatever their widths
export const List = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  column-gap: var(--base-gap-medium);
  align-content: start;
  padding: var(--padding-m);
  overflow-y: auto;

  &.loading {
    opacity: 0.7;
  }
`

export const Row = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
  align-items: center;
  min-height: 32px;
  padding: 2px 6px;
  border-radius: var(--border-radius-m);
  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  .name {
    display: flex;
    align-items: baseline;
    gap: var(--base-gap-small);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .folder {
    font-size: 12px;
    color: var(--md-sys-color-outline);
  }

  .assignees {
    display: flex;
    justify-content: flex-end;
  }

  .status {
    width: auto;
    height: 22px;
    min-height: 22px;
    padding: 0 6px;
    font-size: 12px;

    .status-text {
      margin-left: 4px;
    }
    .status-icon {
      font-size: 16px;
    }
  }
`

export const Empty = styled.div`
  padding: var(--padding-m);
  color: var(--md-sys-color-outline);
`
