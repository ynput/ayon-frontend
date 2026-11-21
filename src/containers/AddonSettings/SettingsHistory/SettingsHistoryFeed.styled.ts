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

/** Shows the history of the setting selected in the editor only */
export const FilterBar = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 8px 0;
  padding: 4px 8px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-m);
  background: transparent;
  text-align: left;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  ${theme.labelMedium}
  ${Comparison.settingName}

  .icon {
    flex-shrink: 0;
    font-size: 16px;
  }

  .hint {
    flex-shrink: 0;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &.active {
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface);

    .icon {
      color: var(--md-sys-color-primary);
    }

    &:hover {
      background-color: var(--md-sys-color-surface-container-high-hover);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
  }
`

/** Day of the saves below it, like the inbox, stays at the top while its saves scroll by */
export const Day = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 2px;
  background-color: var(--md-sys-color-surface-container-low);
  ${theme.labelMedium}
  color: var(--md-sys-color-outline);

  &::after {
    content: '';
    flex: 1;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
`

/** Saves one user made in a row, under their avatar, with a line down to the last one */
export const Run = styled.div`
  position: relative;
  padding: 4px 4px 4px 12px;

  &::before {
    content: '';
    position: absolute;
    left: 21.5px;
    top: 30px;
    bottom: 10px;
    width: 1px;
    background-color: var(--md-sys-color-outline-variant);
  }

  .who {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 24px;
    min-width: 0;
    ${theme.labelMedium}
  }

  .user {
    flex-shrink: 0;
    max-width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--md-sys-color-on-surface);
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
    color: var(--md-sys-color-outline);
  }

  .swatch {
    width: 8px;
    height: 8px;
    flex-shrink: 0;
    border-radius: 50%;
  }

  .saves {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 2px 0 0 20px;
  }
`

export const Save = styled.button`
  position: relative;
  display: block;
  width: 100%;
  padding: 2px 8px;
  border: none;
  border-radius: var(--border-radius-m);
  background: transparent;
  text-align: left;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  ${theme.bodySmall}
  ${Comparison.settingName}

  &:not(.copied):hover,
  &.linked {
    background-color: var(--md-sys-color-surface-container-hover);
    color: var(--md-sys-color-on-surface);

    .name .parent,
    .name .parent + .leaf::before {
      color: var(--md-sys-color-on-surface-variant);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
  }

  /* the first save of a version, with the settings of the version before: nothing to compare */
  &.copied {
    cursor: default;
    font-style: italic;
  }

  .lines {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .change,
  .status {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
    height: 20px;
    line-height: 20px;
  }

  .status {
    align-self: flex-start;
    color: var(--md-sys-color-outline);
  }

  /* the history of one setting: its values matter more than the names in it */
  .values {
    flex: 0 0 auto;
    max-width: 65%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* the time is on the first line only, the lines below use the full width */
  .lines > :first-child {
    padding-right: 44px;
  }

  .time,
  .action {
    position: absolute;
    top: 2px;
    right: 8px;
    line-height: 20px;
    white-space: nowrap;
    ${theme.labelSmall}
  }

  .time {
    font-variant-numeric: tabular-nums;
    color: var(--md-sys-color-outline);
  }

  /* says what clicking does, in place of the time */
  .action {
    display: none;
    color: var(--color-hl-compare-text);
  }

  &:not(.copied):hover,
  &:not(.copied):focus-visible {
    .lines > :first-child {
      padding-right: 116px;
    }

    .time {
      display: none;
    }

    .action {
      display: block;
    }
  }
`

export const Footer = styled.div`
  padding: 12px;
  text-align: center;
  ${theme.bodySmall}
  color: var(--md-sys-color-on-surface-variant);
`
