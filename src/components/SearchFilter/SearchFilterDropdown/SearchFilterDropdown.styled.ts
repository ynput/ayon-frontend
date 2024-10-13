import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const OptionsContainer = styled.ul`
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  max-height: calc(min(300px, calc(100vh - 100px)));
  overflow: auto;

  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);

  padding: var(--padding-m);
  margin: 0;

  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);

  box-shadow: 0px 3px 5px 0px rgba(0, 0, 0, 0.25);
  z-index: 301;
`

export const Item = styled.li`
  margin: 0;
  list-style: none;
  cursor: pointer;

  width: 100%;

  display: flex;
  align-items: center;
  gap: var(--base-gap-large);

  padding: 6px;
  border-radius: var(--border-radius-m);

  background-color: var(--md-sys-color-surface-container-low);

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    &,
    .icon {
      color: var(--md-sys-color-on-primary-container);
    }

    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);
    }
  }

  img {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }

  .check {
    margin-left: auto;
  }
`

export const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`

export const SearchInput = styled.input`
  /* remove default styles */
  appearance: none;
  border: none;
  background: none;
  font: inherit;

  height: 32px;
  width: 100%;
  padding-left: 32px;
  border-radius: var(--border-radius-m);
  border: 1px solid var(--md-sys-color-outline-variant);
`

export const SearchIcon = styled(Icon)`
  position: absolute;
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
`
