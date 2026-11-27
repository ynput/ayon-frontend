import styled from 'styled-components'

// floating over the app, from its bottom right; above the page, below menus and dialogs
export const Panel = styled.section`
  position: fixed;
  z-index: 600;
  width: 340px;
  max-width: calc(100vw - 16px);
  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius-xl);
  background-color: var(--md-sys-color-surface-overlay);
  box-shadow: var(--md-sys-elevation-overlay);
  overflow: hidden;
`

// the panel's handle: drag it anywhere in the window
export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px 6px 8px;
  cursor: grab;
  touch-action: none;
  user-select: none;

  &.dragging {
    cursor: grabbing;
  }

  & > .icon {
    color: var(--md-sys-color-on-surface-variant);
  }
  h2 {
    margin: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

export const Hint = styled.p`
  margin: 0;
  padding: 0 14px 10px;
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
  padding: 6px 14px;
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
