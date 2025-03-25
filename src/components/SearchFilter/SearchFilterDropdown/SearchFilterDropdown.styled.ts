import { Button, Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const OptionsContainer = styled.div`
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  overflow: hidden;

  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);

  box-shadow: 0px 3px 5px 0px rgba(0, 0, 0, 0.25);
  z-index: 301;
`

export const Scrollable = styled.div`
  overflow: auto;
  height: 100%;
  max-height: calc(min(350px, calc(100vh - 100px)));
  padding: var(--padding-m);

  &:has(.toolbar) {
    margin-bottom: 40px;
  }
`

export const OptionsList = styled.ul`
  margin: 0;
  padding: 0;

  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
`

export const Item = styled.li`
  margin: 0;
  list-style: none;
  cursor: pointer;
  user-select: none;

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

export const AddSearch = styled(Button)`
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  &.hasIcon {
    padding: 2px 4px;
    padding-right: 6px;
  }
`

export const Toolbar = styled.div`
  background-color: var(--md-sys-color-surface-container-low);
  left: 0;
  right: 0;

  position: absolute;
  bottom: 0;
  padding: var(--padding-m);
  /* padding-bottom: var(--padding-m); */

  display: flex;
  gap: var(--base-gap-large);
  align-items: center;
`

export const Operator = styled.div`
  display: flex;
  border-radius: var(--border-radius-m);

  .hasIcon {
    padding-right: 16px;
  }

  button:first-child {
    border-radius: var(--border-radius-m) 0 0 var(--border-radius-m);
    border-right: 1px solid var(--md-sys-color-outline);
  }

  button:last-child {
    border-radius: 0 var(--border-radius-m) var(--border-radius-m) 0;
  }
`
