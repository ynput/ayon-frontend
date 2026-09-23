import styled from 'styled-components'

export const Dots = styled.span`
  display: flex;
  align-items: center;

  /* stacked like the user avatars */
  & > * + * {
    margin-left: -3px;
  }
`

export const Dot = styled.span`
  width: 8px;
  height: 8px;
  min-width: 8px;
  border-radius: 50%;
  /* ring in the row colour keeps overlapping dots apart */
  box-shadow: 0 0 0 1px var(--md-sys-color-surface-container-low);
`
