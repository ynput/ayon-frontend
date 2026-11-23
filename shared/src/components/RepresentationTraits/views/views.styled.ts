import styled from 'styled-components'

export const View = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`

export const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  color: var(--md-sys-color-outline);

  strong {
    color: var(--md-sys-color-on-surface);
    font-weight: 600;
  }

  code {
    font-family: monospace;
    color: var(--md-sys-color-on-surface);
    word-break: break-all;
  }

  .warning {
    color: var(--md-sys-color-warning);
  }
`

// compact bar of files: one cell per file (or bucket of files / missing frames)
export const Strip = styled.div`
  display: flex;
  align-items: stretch;
  gap: 1px;
  height: 28px;
  padding: 2px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-lowest);
`

export const StripCell = styled.div`
  position: relative;
  flex: 1 1 0;
  min-width: 1px;
  display: flex;
  align-items: flex-end;
  border-radius: 2px;
  background-color: var(--md-sys-color-surface-container-highest);
  cursor: default;

  /* fill height shows the file size relative to the largest file */
  .fill {
    width: 100%;
    border-radius: 2px;
    background-color: var(--md-sys-color-primary);
    opacity: 0.75;
  }

  &.unknown .fill {
    background-color: var(--md-sys-color-outline);
    opacity: 0.5;
  }

  &.gap {
    background: repeating-linear-gradient(
      -45deg,
      var(--md-sys-color-error-container),
      var(--md-sys-color-error-container) 3px,
      transparent 3px,
      transparent 6px
    );
  }

  &:hover {
    outline: 1px solid var(--md-sys-color-on-surface);
    z-index: 1;

    .fill {
      opacity: 1;
    }
  }
`

export const Axis = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--md-sys-color-outline);
`

export const FileTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th {
    text-align: left;
    font-weight: 600;
    color: var(--md-sys-color-outline);
    padding: 2px 8px 4px 0;
    white-space: nowrap;
  }

  td {
    padding: 2px 8px 2px 0;
    vertical-align: top;
    border-top: 1px solid var(--md-sys-color-surface-container-high);
  }

  td.name {
    font-family: monospace;
    word-break: break-all;
  }

  td.number {
    text-align: right;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  td.hash {
    font-family: monospace;
    white-space: nowrap;
    color: var(--md-sys-color-outline);
  }

  tr.missing td {
    color: var(--md-sys-color-error);
    font-style: italic;
  }
`

export const FileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  .icon {
    color: var(--md-sys-color-outline);
  }

  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .name {
    font-family: monospace;
    font-weight: 600;
    word-break: break-all;
  }

  .dir {
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--md-sys-color-outline);
    word-break: break-all;
  }
`

// frame range timeline: handles, range and in/out on one bar
export const Timeline = styled.div`
  position: relative;
  height: 22px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-lowest);
  overflow: hidden;

  .part {
    position: absolute;
    top: 0;
    bottom: 0;
  }

  .handle {
    background-color: var(--md-sys-color-surface-container-highest);
  }

  .range {
    background-color: var(--md-sys-color-primary-container);
  }

  .inout {
    top: 5px;
    bottom: 5px;
    border-radius: 2px;
    background-color: var(--md-sys-color-primary);
  }
`

export const ResolutionBox = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .frame {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--md-sys-color-outline);
    border-radius: 2px;
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-outline);
    font-size: 0.75rem;
  }
`
