import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

// Event specific cell and row looks. The table itself is ListTable's data variant.
export const Wrapper = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;

  .spin {
    animation: ${spin} 1s linear infinite;
  }

  .icon {
    font-size: 18px;
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .time {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
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
    white-space: nowrap;
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

  && .table-list-row.severity-error:not(.selected) td .inner-td {
    background-color: color-mix(in srgb, var(--md-sys-color-error) 8%, transparent);
  }

  && .table-list-row.severity-error td:first-child .inner-td {
    box-shadow: inset 2px 0 0 var(--md-sys-color-error);
  }

  && .table-list-row.severity-warning td:first-child .inner-td {
    box-shadow: inset 2px 0 0 var(--md-sys-color-warning);
  }
`
