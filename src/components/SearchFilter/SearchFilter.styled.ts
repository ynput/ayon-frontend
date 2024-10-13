import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Container = styled.div`
  position: relative;
  width: 100%;
`

export const SearchBar = styled.div`
  display: flex;

  padding: 3px 8px;
  height: 32px;
  align-items: center;
  gap: var(--base-gap-small);

  border-radius: var(--border-radius-m);
  border: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container-low);

  z-index: 301;

  /* search button */
  .search {
    cursor: pointer;
  }
  /* when hovering search, hover whole thing */
  &:has(.search:hover) {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }

  &.empty {
    cursor: pointer;
    &:hover {
      background-color: var(--md-sys-color-surface-container-low-hover);
    }
  }
`

export const SearchBarFilters = styled.div`
  display: flex;
  gap: var(--base-gap-small);
`

export const FilterButton = styled(Button)`
  &.hasIcon {
    padding: 2px;
  }
`

export const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  z-index: 300;
`
