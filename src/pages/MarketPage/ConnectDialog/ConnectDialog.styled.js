import styled from 'styled-components'

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const List = styled.ul`
  /* reset defaults */
  list-style: none;
  margin: 0;
  display: flex;
  flex-direction: column;

  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-xxl);
  padding: var(--padding-m);
`

export const ListItem = styled.li`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  padding: 8px;
  border-radius: 8px;

  .icon {
    font-size: 1.95rem;
  }

  /* second last child */
  &:nth-last-child(2) {
    margin-bottom: 16px;
  }
`
