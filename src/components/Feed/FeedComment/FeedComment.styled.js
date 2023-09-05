import styled from 'styled-components'

export const Comment = styled.li`
  /* reset default */
  list-style: none;
  margin: 0;
  padding: 0;

  display: flex;
  flex-direction: column;
  gap: 4px;

  width: 100%;
`

export const Body = styled.div`
  background-color: var(--md-sys-color-surface-container);
  border-radius: var(--border-radius-m);
  padding: 8px;
  position: relative;

  /* remove first and last margins */
  & > *:first-child {
    margin-top: 0;
  }

  & > *:last-child {
    margin-bottom: 0;
  }

  a {
    color: var(--md-sys-color-primary);
  }
`
