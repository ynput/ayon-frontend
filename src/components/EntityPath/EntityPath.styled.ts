import styled from 'styled-components'

export const Path = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--base-gap-small);
  user-select: none;
  color: var(--md-sys-color-outline);

  flex: 1;
`

export const Segment = styled.span`
  cursor: pointer;
  padding: 0px 2px;
  border-radius: var(--border-radius-m);
  transition: all 0.2s;

  &:hover {
    /* text-decoration: underline; */
    background-color: var(--md-sys-color-surface-container-highest-hover);
    color: var(--md-sys-color-on-surface);
  }
`
