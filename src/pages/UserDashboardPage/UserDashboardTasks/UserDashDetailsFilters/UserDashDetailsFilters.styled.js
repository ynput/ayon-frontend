import styled from 'styled-components'
import { Toolbar, Button } from '@ynput/ayon-react-components'

export const FiltersToolbar = styled(Toolbar)`
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  border-left: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container-low);
  padding: 8px;
  border-radius: 0 0 8px 8px;

  position: absolute;
  translate: 0 calc(100% - 1px);
  bottom: 0;

  right: 0;

  z-index: 100;
`
export const FilterButton = styled(Button)`
  padding: 4px 12px;
`
