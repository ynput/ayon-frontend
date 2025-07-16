import { InputText } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Container = styled.div`
  padding: var(--padding-m);
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-l);
  display: flex;
  flex-direction: column;
  max-height: 100%;
  overflow: hidden;
`

export const Header = styled.h4`
  margin: 0;
  padding: 0;
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
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  padding: 4px 4px;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  .label {
    flex: 1;
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
  padding-top: var(--padding-m);

  max-height: 300px;
`

export const Search = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  .icon {
    position: absolute;
    left: 4px;
  }
`

export const SearchInput = styled(InputText)`
  flex: 1;
  border: none;
  background-color: unset;
  padding-left: 28px;
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
  height: 100%;
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
    gap: var(--base-gap-small);
  }

  .type {
    margin-left: 80px;
    color: var(--md-sys-color-outline);
  }
`
