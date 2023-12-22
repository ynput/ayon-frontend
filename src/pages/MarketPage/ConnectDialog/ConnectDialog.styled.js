import styled from 'styled-components'

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: var(--padding-l);
`

export const List = styled.ul`
  /* reset defaults */
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`

export const ListItem = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;

  .icon {
    font-size: 1.95rem;
  }
`
