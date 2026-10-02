import styled, { keyframes } from 'styled-components'
import { theme } from '@ynput/ayon-react-components'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

export const Scroll = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-low);
  outline: none;

  &:focus-visible {
    box-shadow: inset 0 0 0 2px var(--md-sys-color-primary);
  }

  .spin {
    animation: ${spin} 1s linear infinite;
  }
`

export const Header = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  height: 32px;
  background-color: var(--md-sys-color-surface-container);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

export const HeaderCell = styled.div`
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 8px;
  ${theme.labelMedium}
  color: var(--md-sys-color-on-surface-variant);
  user-select: none;

  &.grow {
    flex: 1 1 auto;
    min-width: 200px;
  }
`

export const Resizer = styled.div`
  position: absolute;
  right: 0;
  top: 6px;
  bottom: 6px;
  width: 5px;
  cursor: col-resize;
  border-right: 1px solid var(--md-sys-color-outline-variant);

  &:hover,
  &.resizing {
    border-right: 2px solid var(--md-sys-color-primary);
  }
`

export const Body = styled.div`
  position: relative;
`

export const BodyRow = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  height: 32px;
  cursor: pointer;
  border-left: 2px solid transparent;
  ${theme.bodyMedium}

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &.severity-error {
    border-left-color: var(--md-sys-color-error);
    background-color: color-mix(in srgb, var(--md-sys-color-error) 8%, transparent);
  }
  &.severity-warning {
    border-left-color: var(--md-sys-color-warning);
  }

  &.selected,
  &.selected:hover {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }
`

export const Cell = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  overflow: hidden;
  white-space: nowrap;

  &.grow {
    flex: 1 1 auto;
    min-width: 200px;
  }

  &.severity {
    justify-content: center;
    padding: 0;
    .icon {
      font-size: 18px;
    }
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .time {
    font-variant-numeric: tabular-nums;
    color: var(--md-sys-color-on-surface-variant);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--md-sys-color-on-surface-variant);
    .icon {
      font-size: 16px;
    }
    &.failed {
      color: var(--md-sys-color-error);
    }
    &.pending,
    &.in_progress {
      color: var(--md-sys-color-primary);
    }
  }
`

export const LoaderRow = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  color: var(--md-sys-color-on-surface-variant);
`
