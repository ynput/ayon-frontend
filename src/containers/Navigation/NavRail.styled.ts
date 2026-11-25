import type { FocusEvent } from 'react'
import styled, { css } from 'styled-components'
import { Link } from 'react-router-dom'
import { Icon } from '@ynput/ayon-react-components'

// one static width: the icons need their labels, addon icons are not recognisable alone
export const RAIL_WIDTH = 72

export const Rail = styled.nav`
  flex: 0 0 ${RAIL_WIDTH}px;
  width: ${RAIL_WIDTH}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 2px 8px;
  overflow: hidden;
  /* the app chrome sits on the page background, like the top bar and the tabs */
  background-color: var(--md-sys-color-surface-container-low);

  /* editing the layout: every item shows, nothing folds into More */
  &.editing {
    overflow-y: auto;
  }
`

export const Divider = styled.hr`
  flex-shrink: 0;
  width: 40px;
  margin: 4px 0;
  border: none;
  border-top: 1px solid var(--md-sys-color-outline-variant);
`

export const Spacer = styled.div`
  flex: 1;
  min-height: 8px;
`

export const Label = styled.span`
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  line-height: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
`

const itemStyles = css`
  position: relative;
  flex-shrink: 0;
  width: 68px;
  min-height: 52px;
  padding: 6px 1px 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: var(--border-radius-l);
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none;
  user-select: none;

  .icon {
    font-size: 22px;
  }

  &:hover {
    background-color: var(--color-nav-hover);
    color: var(--md-sys-color-on-surface);
  }
  &:active {
    background-color: var(--color-nav-active);
  }
  &:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
  }

  &.active {
    background-color: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-on-surface);

    .icon {
      color: var(--md-sys-color-primary);
      font-variation-settings: 'FILL' 1;
    }
  }

  /* the admin area's items: smaller, so it takes little of the sidebar */
  &.compact {
    min-height: 44px;
    padding: 4px 1px 3px;
    gap: 2px;

    .icon {
      font-size: 20px;
    }
    ${Label} {
      font-size: 10px;
      line-height: 13px;
    }
  }
`

// while the layout is edited: hides or shows the item; always there on a hidden one
export const ItemEye = styled(Icon)`
  position: absolute;
  top: 2px;
  right: 2px;
  padding: 2px;
  border-radius: var(--border-radius-m);
  font-size: 16px !important;
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0;
  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-on-surface);
  }
`

export const Item = styled(Link)`
  ${itemStyles}

  &:hover ${ItemEye}, &:focus-visible ${ItemEye} {
    opacity: 1;
  }
  &.layout-hidden {
    & > .icon:not(${ItemEye}),
    & > ${Label} {
      opacity: 0.4;
    }
    ${ItemEye} {
      opacity: 1;
    }
  }
`

// the admin area at the bottom: a divider, then its items
export const Dock = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`

// More: a button styled as an item
export const MoreItem = styled.button`
  ${itemStyles}
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
`

// where a menu opens: beside the rail, level with the item. Escape focuses it, which hands the
// focus back to its button.
export const MoreAnchor = styled.span.attrs({
  tabIndex: -1,
  onFocus: (e: FocusEvent<HTMLSpanElement>) => e.currentTarget.closest('button')?.focus(),
})`
  position: absolute;
  left: calc(100% + 4px);
  top: -8px;
  width: 0;
  height: 0;
`

// the Admin menu opens upwards from the button's bottom, so it ends level with the button
export const DockAnchor = styled(MoreAnchor)`
  top: auto;
  bottom: 0;
`

// a restart is waiting: the dot the apps menu's button had
export const NotificationDot = styled.span`
  position: absolute;
  top: 4px;
  right: 18px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--md-sys-color-error);
  pointer-events: none;
`
