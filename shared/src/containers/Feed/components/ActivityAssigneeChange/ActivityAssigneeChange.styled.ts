import styled from 'styled-components'

export const StatusChange = styled.li`
  /* reset default */
  list-style: none;
  margin: 0;
  padding: 0;

  display: flex;
  gap: var(--base-gap-small);

  width: 100%;
  padding: 4px 8px;
  border-radius: var(--border-radius-m);
  user-select: none;
`

export const Body = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: start;
  flex: 1;
  gap: var(--base-gap-small);
  padding: 0px 4px;
  overflow: hidden;
`

export const Text = styled.span`
  color: var(--md-sys-color-outline);
  white-space: wrap;
  font-size: 12px;
`
