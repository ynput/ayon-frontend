import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 4px;
  gap: var(--base-gap-small);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

export const HeaderLabel = styled.span`
  font-weight: 600;
  user-select: none;
`

export const FiltersContainer = styled.div`
  display: flex;
  gap: var(--base-gap-small);
`

export const FilterButton = styled(Button)`
  background-color: unset;
`
