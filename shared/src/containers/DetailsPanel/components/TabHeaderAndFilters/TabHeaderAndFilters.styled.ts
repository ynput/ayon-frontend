import { EnumWidget } from '@shared/containers/ProjectTreeTable'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 8px;
  gap: var(--base-gap-small);
`

export const HeaderLabel = styled.span`
  font-weight: 600;
  user-select: none;
`

export const FiltersContainer = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  flex: 1;
  min-width: 0;
  align-items: center;
`

export const FilterButton = styled(Button)`
  background-color: unset;
  &.hasIcon {
    padding: 4px;
  }
`

export const SearchFilterContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  row-gap: 4px;
  border-radius: var(--border-radius-m);
  min-height: 34px;
  padding: 4px 6px 4px 8px;
  flex: 1;
  min-width: 0;
  background-color: var(--md-sys-color-surface-container-lowest);

  &.selected,
  &.open,
  &:focus-within {
    box-shadow: 0 0 0 1px var(--md-sys-color-primary-container);
  }

  .search-icon {
    color: var(--md-sys-color-outline);
    font-size: 18px;
  }
`

export const Options = styled(EnumWidget)`
  width: 28px;
  height: 28px;
`

export const SearchInput = styled.input`
  flex: 1;
  min-width: 80px;
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

export const FilterChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 6px;
  border: none;
  border-radius: var(--border-radius-s);
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  font-size: var(--md-sys-typescale-body-medium-size);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;

  &:hover {
    filter: brightness(1.05);
  }

  .chip-label {
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
  }

  .chip-remove {
    font-size: 16px;
    opacity: 0.75;
    border-radius: 50%;
    padding: 1px;

    &:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.1);
    }
  }
`

export const FilterDropdownEmpty = styled.div`
  padding: 8px 10px;
  color: var(--md-sys-color-outline);
  font-size: var(--md-sys-typescale-body-small-size);
  text-align: center;
`

export const FilterDropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  box-shadow: var(--md-sys-elevation-2, 0 2px 8px rgba(0, 0, 0, 0.2));
  max-height: 320px;
  overflow-y: auto;
`

export const FilterDropdownRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--border-radius-s);
  cursor: pointer;
  user-select: none;
  min-height: 28px;

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest);
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }

  .row-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .check-icon {
    color: var(--md-sys-color-primary);
  }

  .chevron-icon {
    color: var(--md-sys-color-outline);
  }

  .row-avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
    background-color: var(--md-sys-color-surface-container);
    flex-shrink: 0;
  }
`

export const FilterDropdownHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 4px 4px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  margin-bottom: 4px;
  user-select: none;

  .header-label {
    font-weight: 600;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

export const BackButton = styled(Button)`
  background-color: unset;
  min-width: unset;
  &.hasIcon {
    padding: 2px;
  }
`

export const ShortcutButton = styled(Button)`
  background-color: var(--md-sys-color-surface-container-lowest);
  min-width: unset;
  height: 34px;
  width: 34px;
  &.hasIcon {
    padding: 4px;
  }

  &.active {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    .icon {
      color: var(--md-sys-color-on-primary-container);
    }

    &:hover {
      filter: brightness(1.05);
    }
  }
`

