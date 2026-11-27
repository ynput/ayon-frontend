import styled from 'styled-components'

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  /* the title row's own actions stay beside it, this one sits at the end */
  margin-left: auto;
`

export const Swatches = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: none;
`

export const Swatch = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
`

export const Value = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  /* the closed dropdown draws no padding of its own: keep the swatches and the name off its edges */
  padding-inline: var(--space-3);
  white-space: nowrap;
`
