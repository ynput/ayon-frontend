import styled, { keyframes } from 'styled-components'

// DIALOG (CONTAINER)
export const Dialog = styled.dialog`
  position: fixed;
  margin: 0;
  inset: 0;
  top: 42px;
  width: auto;
  height: auto;
  z-index: 100;
  border: none;
  background-color: unset;
  padding: 0;

  user-select: none;
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
  gap: 8px;

  /* position */
  position: absolute;
  right: 0;
  top: 0;
  z-index: 30;

  /* animate */
  animation: ${DialogOpenAnimation} 0.03s ease-in forwards;
  transform-origin: top right;
  /* add shadow to each item */
  & > *:not(.sub-menu),
  .sub-menu menu {
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
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
  z-index: 10;
  overflow: hidden;
`
export const MenuWrapper = styled.div`
  position: relative;

  /* sub menu */
  &.sub-menu {
    position: absolute;
    /* margin-right: 16px; */

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
  gap: 8px;
  padding: 8px;

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
  gap: 8px;
  align-self: stretch;
  border-radius: 4px;
  cursor: pointer;
  position: relative;

  :hover {
    background-color: var(--md-sys-color-surface-container-highest);
  }

  .more {
    margin-left: auto;
  }

  /* highlighted button */
  &.highlighted {
    background-color: var(--md-sys-color-secondary-container);
    &:hover {
      background-color: var(--md-sys-color-secondary-container-hover);
    }
  }
`

export const Footer = styled.footer`
  display: flex;
  padding: 8px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  align-self: stretch;
`
