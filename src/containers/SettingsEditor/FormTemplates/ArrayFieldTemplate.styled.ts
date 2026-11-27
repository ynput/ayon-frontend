import styled, { css } from 'styled-components'
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

// Flat layout: the dashed edge of a list's add buttons, which brightens in use
const dashedAddEdge = (className: string) => css`
  &.${className} {
    border: 1px dashed var(--md-sys-color-outline-variant);
    border-radius: var(--border-radius-m);
    background-color: transparent;
    transition: color 0.15s, border-color 0.15s;
  }

  &.${className}:hover, &.${className}:focus-visible {
    border-color: var(--md-sys-color-outline);
    background-color: transparent;
    color: var(--md-sys-color-on-surface);
  }
`

// Flat layout: a full width, dashed "add" row at the end of a list
export const AddItemButton = styled(Button)`
  ${dashedAddEdge('array-add-button')}

  /* the class beats ArrayItemControls' round 30px button rule */
  &.array-add-button {
    flex: 1;
    width: 100%;
    /* slimmer than the items above it */
    height: calc(var(--base-input-size) - var(--space-2, 8px));
    min-height: 0;
    padding-block: 0;
    justify-content: center;
    color: var(--md-sys-color-outline);
  }
`

// Flat layout: an empty list's add button, a small "Add item +" on its label's line
export const AddFirstItemButton = styled(Button)`
  ${dashedAddEdge('array-add-first')}

  &.array-add-first {
    gap: var(--base-gap-small);
    width: auto;
    height: var(--base-input-size);
    /* the plus (20px) centres on the column a list item's X sits in */
    padding: 0 calc((var(--settings-handle-size, 24px) - 20px) / 2) 0 var(--space-2, 8px);
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
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
