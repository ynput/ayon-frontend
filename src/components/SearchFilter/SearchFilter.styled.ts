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

  position: relative;
  z-index: 301;
  overflow: hidden;

  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }

  &:has(.search-filter-item:hover) {
    background-color: var(--md-sys-color-surface-container-low);
  }
`

export const SearchBarFilters = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  white-space: nowrap;
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
