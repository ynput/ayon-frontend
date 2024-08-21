import { Section } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const ListContainer = styled(Section)`
  height: 100%;
  width: 100%;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 0 8px;
  overflow-y: hidden;

  gap: 0px;
`

export const Inner = styled.ul`
  /* reset defaults */
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  border-radius: var(--border-radius-m);
  li span.task, li span.folder{
    overflow: hidden;
    width: 200px;
    text-overflow: ellipsis;
  }
`
