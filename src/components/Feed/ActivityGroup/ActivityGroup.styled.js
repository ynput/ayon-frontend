import styled from 'styled-components'

export const Wrapper = styled.li`
  /* reset default */
  list-style: none;
  margin: 0;
  padding: 0;
  padding: 0px 8px;
`

export const More = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--base-gap-small);
  cursor: pointer;

  padding: 4px 2px;

  border-radius: var(--border-radius-m);
  user-select: none;
  white-space: nowrap;
  font-size: 12px;

  &,
  .icon {
    color: var(--md-sys-color-outline);
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }
`
