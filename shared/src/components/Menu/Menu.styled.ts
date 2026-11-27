import { Button } from '@ynput/ayon-react-components'
import styled, { keyframes } from 'styled-components'

// the dialog starts below the app header, so menus positioned above it are clipped and unscrollable
export const DIALOG_TOP_OFFSET = 42
export const MENU_EDGE_PADDING = 8
// highest viewport y a menu may occupy
export const MENU_TOP_BOUND = DIALOG_TOP_OFFSET + MENU_EDGE_PADDING

// DIALOG (CONTAINER)
export const Dialog = styled.dialog`
  position: fixed;
  margin: 0;
  inset: 0;
  top: ${DIALOG_TOP_OFFSET}px;
  width: auto;
  height: auto;
  z-index: 1000;
  border: none;
  background-color: unset;
  padding: 0;

  user-select: none;

  overflow: auto;
  /* remove scroll bar */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
  padding-bottom: 60px;
`

const DialogOpenAnimation = keyframes`
    from {
        scale: 0.95;
        opacity: 0.6;
    }
    to {
        scale: 1;
        opacity: 1;
    }
`

export const DialogContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  min-height: 0;

  /* position */
  position: absolute;
  right: 0;
  top: 0;
  width: fit-content;
  z-index: 30;

  /* animate */
  animation: ${DialogOpenAnimation} 0.03s ease-in forwards;

  /* transform origin based on alignment */
  &.right {
    transform-origin: top right;
  }
  &.left {
    transform-origin: top left;
  }

  /* add shadow to each item */
  & > *:not(.sub-menu),
  .sub-menu menu {
    box-shadow: var(--menu-shadow);
  }

  /* theme support */
  &.dark {
    color: var(--md-sys-color-on-surface, #fff);
    /* override children backgrounds if needed */
    & > * {
      color: var(--md-sys-color-on-surface, #fff) !important;
    }
  }
`

// MENULIST
export const Section = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;

  padding: 0px;
  border: var(--menu-border-width) solid var(--menu-border-color);
  border-radius: var(--menu-radius);
  /* colors */
  background-color: var(--md-sys-color-surface-overlay);
  color: var(--md-sys-color-on-surface);
  z-index: 10;
  overflow: hidden;
`
export const MenuWrapper = styled.div`
  position: relative;
  border-radius: var(--menu-radius);
  display: flex;
  flex-direction: column;
  min-height: 0;

  & > * {
    min-height: 0;
  }

  /* sub menu */
  &.sub-menu {
    position: absolute;

    border-radius: var(--menu-radius);
    width: max-content;
    z-index: 30;

    & > * {
      border: var(--menu-border-width) solid var(--menu-border-color);
      border-radius: var(--menu-radius);
      overflow-x: hidden;
    }
  }
`

export const Menu = styled.menu`
  /* reset defaults */
  display: flex;
  list-style-type: none;
  margin-block-start: 0;
  margin-block-end: 0;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
  padding-inline-start: 0;

  /* custom */
  flex-direction: column;
  gap: var(--menu-gap);
  padding: var(--menu-padding);
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;

  /* shrink the padding when compact */
  &.compact {
    padding: 4px;
    gap: var(--base-gap-small);
  }

  /* colors */
  background-color: var(--md-sys-color-surface-overlay);

  /* divider, like the context menu's */
  hr {
    margin: var(--menu-divider-margin) 0;
    width: 100%;
    border: none;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
`

export const Item = styled.li`
  display: flex;
  min-height: var(--menu-item-height);
  padding: var(--menu-item-padding);
  justify-content: flex-start;
  align-items: center;
  gap: var(--menu-item-gap);
  align-self: stretch;
  border-radius: var(--menu-item-radius);
  cursor: pointer;
  position: relative;
  user-select: none;

  span {
    display: inline-block;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest);
  }

  .hover-swap {
    display: none;
    cursor: grab;
  }
  &:hover {
    .hover-swap-default {
      display: none;
    }
    .hover-swap {
      display: inline-block;
    }
  }

  .more {
    margin-left: auto;
  }

  /* highlighted item */
  &.highlighted {
    background-color: var(--md-sys-color-secondary-container);
    &:hover {
      background-color: var(--md-sys-color-secondary-container-hover);
    }
  }

  /* selected item */
  &.selected {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);
    }
  }

  &.notification::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    transform: translate(25%, -25%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--md-sys-color-error);
  }

  &.danger {
    &,
    .icon {
      color: var(--md-sys-color-error);
    }

    &:hover {
      background-color: var(--md-sys-color-error-container);

      &,
      .icon {
        color: var(--md-sys-color-on-error-container);
      }
    }
  }

  &.dev {
    &,
    .icon {
      color: var(--color-hl-developer);
    }

    &:hover {
      background-color: var(--color-hl-developer-container-hover);
    }
  }

  /* needs a Power Pack license: a bolt at the end of the row */
  .power-bolt {
    margin-left: auto;
    color: var(--md-sys-color-tertiary);
    font-variation-settings: 'FILL' 1;
  }

  &.disabled {
    user-select: none;
    pointer-events: none;
    &,
    .icon {
      color: var(--md-sys-color-outline);
    }
    background-color: unset;
  }
`

// floats right; the padding keeps a 24px gap from the label when the row is narrow
export const EndActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  margin-left: auto;
  padding-left: 24px;
`

// the end button is a plain Button; its colours only switch to the primary scheme on the selected row
export const EndAction = styled(Button)`
  margin-left: auto;
  &.hasIcon {
    padding: 4px;
  }
  .icon {
    font-size: 16px;
  }

  .selected & {
    background-color: var(--md-sys-color-on-primary);
    color: var(--md-sys-color-primary);
  }
`

export const Img = styled.img`
  width: 18px;
  height: 18px;
  object-fit: contain;
`

export const Footer = styled.footer`
  position: relative;
  display: flex;
  padding: 8px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  align-self: stretch;
  background-color: var(--md-sys-color-surface-container-lowest);

  user-select: text;

  button {
    display: none;

    position: absolute;
    right: 2px;
    border-radius: 8px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
  }

  /* hover show button */
  &:hover {
    button {
      display: flex;
    }
  }
`
