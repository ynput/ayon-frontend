import styled, { css } from 'styled-components'
import { theme } from '@ynput/ayon-react-components'

/** `Parent › Setting` on one line, the parent gives way first */
export const settingName = css`
  .name {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;

    .parent,
    .leaf {
      flex: 0 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .parent {
      color: var(--md-sys-color-outline);
    }

    /* leaves the parent enough to recognise it */
    .parent + .leaf {
      flex-shrink: 0;
      max-width: calc(100% - 9ch);
    }

    .parent + .leaf::before {
      content: '\\00a0›\\00a0';
      color: var(--md-sys-color-outline);
    }
  }
`

export const Panel = styled.div`
  display: flex;
  flex-direction: column;
  flex: 2 1 0;
  min-height: 160px;
  overflow: hidden;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-low);
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
    color: var(--color-hl-compare-text);
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

/** A setting that differs: its name, and below it its value then and now, like a split diff */
export const Row = styled.button`
  position: relative;
  display: block;
  width: 100%;
  padding: 4px 12px 6px 30px;
  border: none;
  background: transparent;
  text-align: left;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  ${theme.bodySmall}
  ${settingName}

  &:hover {
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

  .head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
    line-height: 20px;
  }

  .note {
    flex-shrink: 0;
    ${theme.labelSmall}
    color: var(--md-sys-color-outline);
  }

  .diff {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: start;
    gap: 4px;
    margin-top: 2px;
    font-family: monospace;
    font-size: 11px;
    line-height: 16px;

    .then,
    .now {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      min-width: 0;
      overflow: hidden;
      overflow-wrap: anywhere;
      color: var(--md-sys-color-on-surface);
    }

    /* what it was: crossed out, like a diff */
    .then {
      color: var(--md-sys-color-on-surface-variant);
      text-decoration: line-through;
      text-decoration-color: var(--md-sys-color-outline);
    }

    .arrow {
      color: var(--md-sys-color-outline);
    }

    /* not overridden, or no such setting */
    .inherited,
    .missing {
      font-style: italic;
      color: var(--md-sys-color-on-surface-variant);
    }

    .missing {
      text-decoration: none;
    }
  }

  /* in the gutter, so it never wraps */
  .staged {
    position: absolute;
    left: 10px;
    top: 14px;
    transform: translateY(-50%);
    font-size: 14px;
    color: var(--md-sys-color-primary);
  }
`
