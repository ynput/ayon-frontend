import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'
import { COMPARE_COLOR } from './settingsHistoryHelpers'

export const Panel = styled.div`
  display: flex;
  flex-direction: column;
  flex: 2 1 0;
  min-height: 160px;
  overflow: hidden;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-low);
  box-shadow: inset 3px 0 0 ${COMPARE_COLOR};
`

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 4px 6px 12px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  ${theme.titleSmall}

  > .icon {
    margin-right: 4px;
    color: ${COMPARE_COLOR};
  }

  .label {
    flex: 1;
    min-width: 0;

    small {
      display: block;
      ${theme.labelSmall}
      color: var(--md-sys-color-on-surface-variant);
    }
  }
`

export const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 0 8px;
`

export const AddonHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px 2px;
  ${theme.labelLarge}

  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .versions {
    flex: 1;
    ${theme.labelSmall}
    color: var(--md-sys-color-on-surface-variant);
    font-variant-numeric: tabular-nums;
  }
`

export const Status = styled.div`
  padding: 2px 12px 4px 30px;
  ${theme.bodySmall}
  color: var(--md-sys-color-on-surface-variant);
`

/** Titles of the section the settings below it are in */
export const Parent = styled.div`
  padding: 8px 12px 0 30px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${theme.labelSmall}
  color: var(--md-sys-color-on-surface-variant);
`

export const Row = styled.button`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 8px;
  width: 100%;
  padding: 3px 12px 3px 30px;
  border: none;
  background: transparent;
  text-align: left;
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  ${theme.bodySmall}

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
  }

  .name {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }

  .values {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
    margin-left: auto;
    font-size: 11px;
    white-space: nowrap;

    .before,
    .after {
      font-family: monospace;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .before {
      color: ${COMPARE_COLOR};
    }

    .icon {
      align-self: center;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .note {
      color: var(--md-sys-color-on-surface-variant);
    }
  }

  /* in the gutter, so it never wraps */
  .staged {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    color: var(--md-sys-color-primary);
  }
`
