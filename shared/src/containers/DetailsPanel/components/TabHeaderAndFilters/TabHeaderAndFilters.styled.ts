import { EnumWidget } from '@shared/containers/ProjectTreeTable'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 8px;
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
  &.hasIcon {
    padding: 4px;
  }
`

export const SearchFilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  border-radius: var(--border-radius-m);
  overflow: hidden;
  transition: width 0.2s ease;
  width: 28px;
  height: 28px;
  box-shadow: none;
  padding-right: 4px;

  &.expanded {
    width: 200px;
    box-shadow: 0 0 0 1px var(--md-sys-color-primary-container);
    background-color: var(--md-sys-color-surface-container-lowest);
  }
`

export const Options = styled(EnumWidget)`
  width: 28px;
  height: 28px;
`

export const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-body-medium-size);
  padding: 4px 0;

  &::placeholder {
    color: var(--md-sys-color-outline);
  }
`

export const ClearButton = styled(Button)`
  background-color: unset;
  min-width: unset;
  &.hasIcon {
    padding: 2px;
  }
`
