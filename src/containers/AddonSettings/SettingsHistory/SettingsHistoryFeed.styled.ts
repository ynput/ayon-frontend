import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'
import * as Comparison from './SettingsComparisonPanel.styled'

export const Panel = styled(Comparison.Panel)`
  flex: 1 1 0;
`

export const Header = styled(Comparison.Header)`
  > .icon {
    color: var(--md-sys-color-on-surface-variant);
  }
`

export const List = Comparison.List

/** Day of the saves below it, like the inbox, stays at the top while its saves scroll by */
export const Day = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 4px;
  background-color: var(--md-sys-color-surface-container-low);
  ${theme.labelMedium}
  color: var(--md-sys-color-outline);

  &::after {
    content: '';
    flex: 1;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
`

export const Entry = styled.button`
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  column-gap: 8px;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: transparent;
  text-align: left;
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  ${theme.bodySmall}

  &:hover,
  &.linked {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  /* nothing to compare: the settings were saved as they were */
  &.empty {
    cursor: default;

    .head {
      color: var(--md-sys-color-on-surface-variant);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
  }

  /* compared last, when coming back from comparing */
  &.selected {
    box-shadow: inset 3px 0 0 var(--color-hl-compare);
  }

  .avatar {
    grid-row: span 2;
    margin-top: 1px;
  }

  &.empty .avatar {
    grid-row: auto;
  }

  .head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
    height: 20px;
  }

  .user {
    flex-shrink: 0;
    max-width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    ${theme.labelLarge}
  }

  .addon {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    ${theme.labelSmall}
    color: var(--md-sys-color-on-surface-variant);
  }

  .swatch {
    width: 8px;
    height: 8px;
    flex-shrink: 0;
    border-radius: 50%;
  }

  .none {
    flex-shrink: 0;
    ${theme.labelSmall}
    color: var(--md-sys-color-on-surface-variant);
  }

  .time {
    margin-left: auto;
    ${theme.labelSmall}
    font-variant-numeric: tabular-nums;
    color: var(--md-sys-color-on-surface-variant);
  }

  .changes {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .change,
  .status {
    display: flex;
    align-items: baseline;
    gap: 8px;
    height: 20px;
    line-height: 20px;
  }

  .status {
    color: var(--md-sys-color-on-surface-variant);
  }

  /* Parent › Setting, the parent gives way first */
  .name {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;

    .parent,
    .leaf {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .parent {
      flex: 0 100 auto;
      min-width: 4ch;
      color: var(--md-sys-color-on-surface-variant);
    }

    .leaf {
      flex: 0 0 auto;
      max-width: calc(100% - 5ch);
    }

    .parent + .leaf::before {
      content: '\\00a0›\\00a0';
      color: var(--md-sys-color-on-surface-variant);
    }
  }

  .values {
    display: flex;
    align-items: baseline;
    gap: 4px;
    flex-shrink: 0;
    max-width: 60%;
    font-size: 11px;
    white-space: nowrap;

    .before,
    .after {
      max-width: 10ch;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: monospace;
    }

    .before,
    .note {
      color: var(--md-sys-color-on-surface-variant);
    }

    .icon {
      align-self: center;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }
  }
`

export const Footer = styled.div`
  padding: 12px;
  text-align: center;
  ${theme.bodySmall}
  color: var(--md-sys-color-on-surface-variant);
`
