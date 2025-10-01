import styled, { keyframes } from 'styled-components'

// DIALOG (CONTAINER)
export const Dialog = styled.dialog`
  position: fixed;
  margin: 0;
  inset: 0;
  top: 42px;
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
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
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

  padding: 0px;
  border-radius: 8px;
  /* colors */
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  z-index: 10;
  overflow: hidden;
`
export const MenuWrapper = styled.div`
  position: relative;
  border-radius: 8px;

  /* sub menu */
  &.sub-menu {
    position: absolute;
    bottom: 0;

    border-radius: 8px;
    width: max-content;
    z-index: 30;

    & > * {
      border-radius: 8px;
      overflow: hidden;
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
  gap: var(--base-gap-large);
  padding: 8px;

  /* shrink the padding when compact */
  &.compact {
    padding: 4px;
    gap: var(--base-gap-small);
  }

  /* colors */
  background-color: var(--md-sys-color-surface-container-high);

  /* divider */
  hr {
    margin: 0;
    width: 100%;
    border-style: solid;
    opacity: 0.5;
    border-color: var(--md-sys-color-surface-container-highest);
  }
`

export const Item = styled.li`
  display: flex;
  padding: 6px 16px 6px 12px;
  justify-content: flex-start;
  align-items: center;
  gap: var(--base-gap-large);
  align-self: stretch;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  user-select: none;

  span {
    display: inline-block;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest);
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

  &.power {
    &,
    .icon {
      color: var(--md-sys-color-tertiary);
    }
    [icon='bolt'] {
      font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
    }
    .shortcut {
      color: var(--md-sys-color-on-surface);
    }
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
