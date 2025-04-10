import styled from 'styled-components'
import { Toolbar, Button } from '@ynput/ayon-react-components'

export const FiltersToolbar = styled(Toolbar)`
  border-radius: 0 0 8px 8px;
  gap: var(--base-gap-small) !important;
  position: relative;

  z-index: 100;
`
export const FilterButton = styled(Button)`
  box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.1);
  padding: 4px 12px;
`
