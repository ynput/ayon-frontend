import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

export const ArrayItemControls = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 5px;

  button {
    border-radius: 50%;
    width: 30px;
    height: 30px;
  }
`

// Flat layout: a full width, dashed "add" row at the end of a list
export const AddItemButton = styled(Button)`
  /* the class beats ArrayItemControls' round 30px button rule */
  &.array-add-button {
    flex: 1;
    width: 100%;
    height: var(--base-input-size);
    justify-content: center;
    border: 1px dashed var(--md-sys-color-outline-variant);
    border-radius: var(--border-radius-m);
    /* the fill of the list's items, so it reads as the list's next, empty item */
    background-color: var(--settings-input-bg, transparent);
    color: var(--md-sys-color-outline);
    transition: color 0.15s, border-color 0.15s;
  }

  &.array-add-button:hover,
  &.array-add-button:focus-visible {
    border-color: var(--md-sys-color-outline);
    color: var(--md-sys-color-on-surface);
  }
`

// Flat layout: a quiet X, so deleting an item doesn't compete with its fields
export const RemoveItemButton = styled(Button)`
  &.remove-item {
    width: var(--base-input-size);
    height: var(--base-input-size);
    padding: 0;
    border-radius: 50%;
    opacity: 0.5;
    transition: opacity 0.15s;
  }

  &.remove-item:hover,
  &.remove-item:focus-visible {
    opacity: 1;
    color: var(--md-sys-color-error);
  }
`
