import styled from 'styled-components'

export const Preview = styled.div`
  display: flex;
  flex-direction: column;

  max-height: 250px;
  min-height: 150px;
  flex: 1;

  overflow: auto;

  background-color: var(--md-sys-color-surface-container-lowest);
  padding: var(--padding-l);
  border-radius: var(--border-radius);
`

export const Parent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--base-gap-small);

  padding-left: ${({ $depth }) => $depth * 30}px;

  span {
    font-size: var(--md-sys-typescale-body-large-font-size);
  }

  .toggle {
    padding: 2px;
  }
`
