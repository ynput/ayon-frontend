import styled from 'styled-components'
import { Toolbar, Button } from '@ynput/ayon-react-components'

export const FiltersToolbar = styled(Toolbar)`
  padding: 8px;
  border-radius: 0 0 8px 8px;
  /* background-color: var(--md-sys-color-surface-container-low); */

  position: absolute;
  translate: 0 calc(100% - 1px);
  bottom: 0;
  left: 0;
  right: 0;

  z-index: 100;
`
export const FilterButton = styled(Button)`
  box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.1);
`
