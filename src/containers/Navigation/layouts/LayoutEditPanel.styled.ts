import styled from 'styled-components'

// floating over the app, from the middle of the window; above the page, below menus and dialogs.
// Edged in the accent colour: the app is in a mode while it shows
export const Panel = styled.section`
  position: fixed;
  z-index: 600;
  width: 380px;
  max-width: calc(100vw - 16px);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--md-sys-color-primary);
  border-radius: var(--border-radius-xl);
  background-color: var(--md-sys-color-surface-overlay);
  box-shadow: var(--md-sys-elevation-overlay), 0 12px 40px rgb(0 0 0 / 35%);
  overflow: hidden;
`

// the panel's handle, in the accent colour: drag it anywhere in the window
export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px 10px 14px;
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  cursor: grab;
  touch-action: none;
  user-select: none;

  &.dragging {
    cursor: grabbing;
  }

  h2 {
    flex: 1;
    margin: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .handle {
    opacity: 0.7;
  }
`

export const Hint = styled.p`
  margin: 0;
  padding: 10px 14px;
  color: var(--md-sys-color-on-surface-variant);
`

// the layout's options, a row each
export const Rows = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 0;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

export const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 4px 14px;

  input {
    flex: 1;
    max-width: 240px;
  }
`

// a row's note, under it
export const Note = styled.p`
  margin: -4px 0 4px;
  padding: 0 14px;
  text-align: right;
  color: var(--md-sys-color-on-surface-variant);
`

// two ways to show something, one of them chosen
export const Choice = styled.div`
  display: flex;
  padding: 2px;
  gap: 2px;
  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-highest);

  button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: none;
    border-radius: var(--border-radius-m);
    background: none;
    color: var(--md-sys-color-on-surface-variant);
    font: inherit;
    cursor: pointer;

    .icon {
      font-size: 18px;
    }
    &:hover {
      color: var(--md-sys-color-on-surface);
    }
    &[aria-pressed='true'] {
      background-color: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
    &:disabled {
      cursor: default;
    }
  }
`

export const Footer = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 12px;
`
