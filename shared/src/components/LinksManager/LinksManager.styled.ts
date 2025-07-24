import { Button, InputText } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Container = styled.div`
  padding: var(--padding-m);
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-l);
  display: flex;
  flex-direction: column;
  height: 100%; /* Use height instead of max-height to enforce constraints */
  overflow: hidden;
  flex-grow: 1;
  min-height: 0; /* Allow flex child to shrink below content size */
`

export const Header = styled.h4`
  margin: 0;
  padding: 0;
  padding-bottom: var(--padding-s);
  flex-shrink: 0;
`

export const SubHeader = styled.h5`
  margin: 0;
  padding: 0;
  padding-bottom: var(--padding-s);
  flex-shrink: 0;

  color: var(--md-sys-color-outline);
`

export const LinksList = styled.ul`
  /* reset any defaults */
  list-style: none;
  padding: 0;
  margin: 0;

  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`

export const LinkItem = styled.li`
  /* reset any defaults */
  list-style: none;
  padding: 0;
  margin: 0;

  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  /* card styling */
  cursor: pointer;
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  padding: 4px 4px;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  .title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--base-gap-small);
    flex: 1;
  }

  .path {
    color: var(--md-sys-color-outline);
  }

  .label {
    font-weight: bold;
  }

  .remove {
    padding: 2px;

    .icon:not(:hover) {
      color: var(--md-sys-color-outline);
    }
  }
`

export const AddLinksContainer = styled.div`
  display: flex;
  flex-direction: column;
  /* hack for search border cutoff */
  padding: 2px;
  margin: -2px;
  padding-top: var(--padding-m);
  flex-shrink: 0; /* Don't shrink this section */
  min-height: 0; /* Allow internal scrolling */
  overflow: hidden; /* Prevent this section from expanding beyond bounds */

  /* Set a reasonable max-height that allows for search functionality */
  max-height: 250px;
`

// wraps the picker and search input
export const SearchButtons = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--base-gap-small);
`

export const Search = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  padding-top: var(--padding-s);

  .input-search {
    position: absolute;
    left: 4px;
  }
`

export const PickerButton = styled(Button)`
  min-width: 110px;
  flex: 1;
  width: 100%;
`

export const SearchInput = styled(InputText)`
  flex: 1;
  border: none;
  background-color: var(--md-sys-color-surface-container);
  padding-left: 28px;
  width: 100%;
  min-width: 224px;
`

export const Error = styled.div`
  color: var(--md-sys-color-error);
  margin-top: var(--base-gap-small);
`

export const SearchItems = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  padding: var(--padding-m) 0;
  flex: 1; /* Take available space instead of height: 100% */
  min-height: 0; /* Allow shrinking */
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
`

export const SearchItem = styled.li`
  padding: var(--padding-s);
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  border-radius: var(--border-radius-m);
  cursor: pointer;
  overflow: hidden;
  min-height: min-content;

  &:hover,
  &:focus,
  &.selected {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  &.loading {
    cursor: default;
    opacity: 0.6;

    .icon,
    .label,
    .type {
      background-color: var(--md-sys-color-outline);
      color: transparent;
      border-radius: var(--border-radius-s);
      animation: shimmer 1.5s infinite;
    }

    .icon {
      width: 16px;
      height: 16px;
    }

    .label {
      height: 16px;
      flex: 1;
    }

    .type {
      width: 60px;
      height: 14px;
    }
  }

  @keyframes shimmer {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      opacity: 0.6;
    }
  }

  .icon {
    flex-shrink: 0;
  }

  .label {
    flex: 1;
    display: flex;
    column-gap: var(--base-gap-small);
    flex-wrap: wrap;

    & > * {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .type {
    margin-left: 8px;
    color: var(--md-sys-color-outline);
  }
`
