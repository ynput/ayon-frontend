import styled from 'styled-components'

export const StatusChange = styled.li`
  /* reset default */
  list-style: none;
  margin: 0;
  padding: 0;

  display: flex;
  gap: 4px;

  width: 100%;
  padding: 4px 8px;
  border-radius: var(--border-radius-m);
  user-select: none;
`

export const Body = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
  gap: 4px;
`

export const Text = styled.span`
  color: var(--md-sys-color-outline);
  white-space: nowrap;
  font-size: 12px;
`
