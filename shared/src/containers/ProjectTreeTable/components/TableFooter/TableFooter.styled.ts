import styled from 'styled-components'

export const Footer = styled.tfoot`
  display: grid !important;
  position: sticky;
  bottom: 0;
  z-index: 10;
  background-color: var(--md-sys-color-surface-container-lowest);
`

export const FooterRow = styled.tr`
  display: flex;
  background-color: var(--md-sys-color-surface-container-low);
`

export const FooterCell = styled.td`
  position: relative;
  box-shadow: inset 1px 1px 0 0 var(--md-sys-color-surface-container);
  background-color: var(--md-sys-color-surface-container-lowest);
  display: flex;
  align-items: center;
  height: 34px !important;
  padding: 0 !important;
  overflow: visible;

  &.last-pinned-left {
    box-shadow: inset 1px 1px 0 0 var(--md-sys-color-surface-container),
      inset -2px 0 0 0 var(--md-sys-color-surface-container);
  }

  /* match the special fixed widths used by header/body cells */
  &.__row_selection__ {
    width: 20px !important;
    min-width: unset;
  }
  &.drag-handle {
    width: 24px !important;
    min-width: unset;
  }
`

export const CellContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  width: 100%;
  height: 100%;
  padding: 0 8px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);

  .label {
    color: var(--md-sys-color-outline);
  }
  .value {
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
`

export const Clickable = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  width: 100%;
  height: 100%;
  padding: 0 8px;
  cursor: pointer;
  overflow: hidden;
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);

  .label {
    color: var(--md-sys-color-outline);
  }
  .value {
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
`

export const Bar = styled.div`
  display: flex;
  width: 100%;
  height: 12px;
  border-radius: var(--border-radius-m);
  overflow: hidden;
  gap: 1px;
`

export const BarSegment = styled.div`
  height: 100%;
  min-width: 2px;
`

export const Popover = styled.div`
  position: absolute;
  bottom: calc(100% + 4px);
  left: 8px;
  z-index: 300;
  min-width: 180px;
  max-height: 280px;
  overflow: auto;
  padding: 6px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
`

export const SelectorItem = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  width: 100%;
  box-sizing: border-box;
  padding: 4px 8px;
  border-radius: var(--border-radius-m);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }

  .icon {
    font-size: 16px;
    margin-left: auto;
  }
`

export const SelectorDivider = styled.div`
  height: 1px;
  margin: 4px 0;
  background-color: var(--md-sys-color-surface-container-highest);
`

export const ScopeToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  padding: 4px 8px;
  font-size: 12px;
  white-space: nowrap;

  span {
    flex: 1;
  }
`

export const BreakdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  padding: 3px 4px;
  font-size: 12px;
  white-space: nowrap;

  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .count {
    font-weight: 600;
  }
  .pct {
    color: var(--md-sys-color-outline);
    min-width: 38px;
    text-align: right;
  }
`
