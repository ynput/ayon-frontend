import styled from 'styled-components'

export const Cell = styled.div`
  width: 100%;
  height: 32px;
  user-select: none;
  padding: 0px 4px;

  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  cursor: pointer;

  border-radius: var(--border-radius-m);

  .value {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .loading {
    pointer-events: none;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);

    &,
    .icon {
      color: var(--md-sys-color-on-primary-container);
    }
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
    user-select: none;
  }
`

export const ListCount = styled.span`
  color: var(--md-sys-color-outline);
  padding-right: 4px;
`
