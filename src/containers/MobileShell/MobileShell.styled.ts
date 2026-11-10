import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Sidebar } from 'primereact/sidebar'

export const Bar = styled.nav`
  display: flex;
  flex-shrink: 0;
  padding: 0 4px env(safe-area-inset-bottom);
  border-top: 1px solid var(--md-sys-color-outline-variant);
  /* app chrome sits on the page background, like the top bar */
  background-color: var(--md-sys-color-background);
`

const itemStyles = `
  flex: 1 1 0;
  min-width: 0;
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 0;
  margin: 0;
  padding: 0 2px;
  background: none;
  font: inherit;
  font-size: 12px;
  line-height: 16px;
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;

  &.active {
    color: var(--md-sys-color-primary);
  }

  span:last-child {
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`

export const BarLink = styled(Link)`
  ${itemStyles}

  &:hover {
    color: var(--md-sys-color-on-surface-variant);
  }

  &.active:hover {
    color: var(--md-sys-color-primary);
  }
`

export const BarButton = styled.button`
  ${itemStyles}
`

export const Sheet = styled(Sidebar)`
  &&& {
    width: 100%;
    height: auto;
    max-height: 80vh;
    padding-bottom: env(safe-area-inset-bottom);
    border-radius: 12px 12px 0 0;
    background-color: var(--md-sys-color-surface-overlay);
    box-shadow: var(--md-sys-elevation-overlay);
    color: var(--md-sys-color-on-surface);
  }

  .p-sidebar-header {
    display: none;
  }

  .p-sidebar-content {
    padding: 8px 0;
    overflow-y: auto;
  }
`

const sheetItemStyles = `
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  margin: 0;
  padding: 0 16px;
  border: 0;
  background: none;
  font: inherit;
  text-align: left;
  color: var(--md-sys-color-on-surface);
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    color: var(--md-sys-color-on-surface);
  }

  &:active {
    background-color: var(--color-table-hover);
  }

  &.active {
    background-color: var(--color-table-selected-row);
    color: var(--md-sys-color-on-primary-container);
  }

  &:disabled {
    cursor: default;
    color: var(--md-sys-color-outline);
    background: none;
  }

  span:last-child {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`

export const SheetLink = styled(Link)`
  ${sheetItemStyles}
`

export const SheetButton = styled.button`
  ${sheetItemStyles}
`

export const SheetTitle = styled.div`
  padding: 4px 16px 8px;
  font-size: 12px;
  line-height: 16px;
  color: var(--md-sys-color-on-surface-variant);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

export const SheetSection = styled.div`
  & + & {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }

  menu,
  ul {
    background: none;
    box-shadow: none;
  }
`

export const IconWithDot = styled.span<{ $dot?: boolean }>`
  position: relative;
  display: flex;

  &::after {
    content: '';
    position: absolute;
    top: -2px;
    right: -4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--md-sys-color-error);
    display: ${({ $dot }) => ($dot ? 'block' : 'none')};
  }
`

export const HeaderViewsSlot = styled.div`
  display: flex;
  flex-shrink: 0;
`

export const ViewsTarget = styled.span`
  display: flex;

  && > * {
    margin: 0;
    padding: 10px;
    font-size: 24px;
  }
`
