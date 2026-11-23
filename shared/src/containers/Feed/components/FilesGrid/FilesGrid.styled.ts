import styled from 'styled-components'

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(125px, 1fr));
  gap: var(--base-gap-large);
  padding: var(--padding-s);
  min-width: 0;

  &.compact {
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: var(--base-gap-small);
  }

  max-height: 180px;
  overflow: auto;
`
