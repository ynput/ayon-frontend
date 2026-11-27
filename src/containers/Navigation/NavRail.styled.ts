import type { FocusEvent } from 'react'
import styled, { css } from 'styled-components'
import { Link } from 'react-router-dom'
import { Icon } from '@ynput/ayon-react-components'

// one static width: the icons need their labels, addon icons are not recognisable alone
export const RAIL_WIDTH = 72
// the buttons keep clear of the page's edge
const ITEM_WIDTH = RAIL_WIDTH - 8
// none on top: Home and its divider are above the places
export const RAIL_PADDING_BOTTOM = 8

// the sidebar: a sheet beside the page, from the window's top (inset as far as the top bar's
// padding), with Home at its top and the context's places below
export const Column = styled.nav`
  flex: 0 0 ${RAIL_WIDTH}px;
  width: ${RAIL_WIDTH}px;
  min-height: 0;
  margin: 6px 0 6px 6px;
  /* Home's top level with the path's */
  padding-top: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: var(--border-radius-xxl);
  background-color: var(--md-sys-color-background);
  overflow: hidden;
`

// the context's places, below Home
export const Rail = styled.div`
  flex: 1;
  min-height: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 4px ${RAIL_PADDING_BOTTOM}px;
  overflow: hidden;

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

// while the layout is edited: removes the divider it is on; shows on hover and keyboard focus
export const DividerRemove = styled.button`
  position: absolute;
  right: 2px;
  display: flex;
  padding: 1px;
  border: none;
  border-radius: var(--border-radius-m);
  background: none;
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0;
  cursor: pointer;

  .icon {
    font-size: 14px;
  }
  &:hover {
    background-color: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-on-surface);
  }
  &:focus-visible {
    opacity: 1;
    outline: 2px solid var(--md-sys-color-primary);
  }
`

// while the layout is edited: a divider, tall enough to grab
export const EditDivider = styled.div`
  position: relative;
  width: ${ITEM_WIDTH}px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-m);
  cursor: grab;

  ${Divider} {
    margin: 0;
  }
  &:hover {
    background-color: var(--color-nav-hover);
  }
  &:hover ${DividerRemove} {
    opacity: 1;
  }
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
  width: ${ITEM_WIDTH}px;
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

// while the layout is edited: an item or a divider that can be dragged anywhere on the sidebar
export const SortableEntry = styled.div`
  position: relative;
  flex-shrink: 0;
  touch-action: none;
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

// an item not usable yet: dimmed, its tooltip says why
export const DisabledItem = styled.span`
  ${itemStyles}
  cursor: default;

  & > .icon:not(${ItemEye}),
  & > ${Label} {
    opacity: 0.38;
  }
  &:hover {
    background-color: transparent;
    color: var(--md-sys-color-on-surface-variant);
  }
  &:hover ${ItemEye}, &:focus-visible ${ItemEye}, &.layout-hidden ${ItemEye} {
    opacity: 1;
  }
`

// Home, at the sidebar's top above the context's places, in both: the root of the path, which
// goes on in the top bar
export const HomeItem = styled(Link)`
  ${itemStyles}
  flex-shrink: 0;

  /* at Home: the context, not a place in it (one below is selected), so no fill, only its icon */
  &.here {
    color: var(--md-sys-color-on-surface);

    .icon {
      color: var(--md-sys-color-primary);
      font-variation-settings: 'FILL' 1;
    }
  }
`

// while the layout is edited: adds a divider at the end of the sidebar's items
export const AddDivider = styled.button`
  flex-shrink: 0;
  width: ${ITEM_WIDTH}px;
  margin-top: 4px;
  padding: 3px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 1px dashed var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-l);
  background: none;
  color: var(--md-sys-color-on-surface-variant);
  font: inherit;
  cursor: pointer;

  .icon {
    font-size: 16px;
  }
  &:hover {
    background-color: var(--color-nav-hover);
    color: var(--md-sys-color-on-surface);
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
