import styled from 'styled-components'

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(125px, 1fr));
  gap: var(--base-gap-large);
  padding: var(--padding-s);

  &.compact {
    height: calc(100% + 80px);
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: var(--base-gap-small);
  }

  max-height: calc(
    301px + var(--padding-s) + var(--padding-s) + var(--base-gap-large)+ var(--base-gap-large)
  );
  overflow: auto;
`
