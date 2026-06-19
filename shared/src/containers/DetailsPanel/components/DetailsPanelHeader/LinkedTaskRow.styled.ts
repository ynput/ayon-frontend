import styled from 'styled-components'

export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  overflow: hidden;
`

export const TaskLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: var(--base-gap-small);
  max-width: 100%;
  margin: 0;
  padding: 2px 6px;
  border: none;
  border-radius: var(--border-radius-m);
  background: none;
  color: var(--md-sys-color-on-surface);
  cursor: pointer;

  &:hover {
    background: var(--md-sys-color-surface-container-hover);
  }

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`
