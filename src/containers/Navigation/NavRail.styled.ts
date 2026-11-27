import type { FocusEvent } from 'react'
import styled, { css } from 'styled-components'
import { Link } from 'react-router-dom'
import { Icon } from '@ynput/ayon-react-components'

// one static width: the icons need their labels, addon icons are not recognisable alone
export const RAIL_WIDTH = 72
// the buttons keep clear of the page's edge
const ITEM_WIDTH = RAIL_WIDTH - 8
// icons only (the layout's choice): each item its icon, its name in its tooltip
const ICON_ITEM = 40
const ICONS_ONLY_WIDTH = ICON_ITEM + 8
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

  &.icons-only {
    flex-basis: ${ICONS_ONLY_WIDTH}px;
    width: ${ICONS_ONLY_WIDTH}px;
  }
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

  /* editing the layout: every item shows, nothing folds into More. It scrolls without a
     scrollbar, which would squeeze the items (where scrollbars take room, a Mac with a mouse) */
  &.editing {
    overflow-y: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`

export const Divider = styled.hr`
  flex-shrink: 0;
  width: 40px;
  margin: 4px 0;
  border: none;
  border-top: 1px solid var(--md-sys-color-outline-variant);

  .icons-only & {
    width: 24px;
  }
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

  .icons-only & {
    width: ${ICON_ITEM}px;
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
  /* the arrangement's colour for the context (one for Home, another for projects) */
  .tinted &.active {
    background-color: color-mix(in srgb, var(--rail-tint) 24%, transparent);

    .icon {
      color: var(--rail-tint);
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

  .icons-only &,
  .icons-only &.compact {
    width: ${ICON_ITEM}px;
    min-height: ${ICON_ITEM}px;
    padding: 0;

    ${Label} {
      display: none;
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

  /* in the corner of an icon, clear of it */
  .icons-only & {
    top: 0;
    right: 0;
    padding: 1px;
    font-size: 14px !important;
    background-color: var(--md-sys-color-surface-container-high);
  }
`

// its addon needs a licence: a bolt on the icon's corner, not faded with it
export const LicenseBolt = styled(Icon)`
  position: absolute;
  top: 18px;
  left: calc(50% + 4px);
  padding: 1px;
  border-radius: 50%;
  background-color: var(--md-sys-color-background);
  color: var(--md-sys-color-tertiary);
  font-size: 12px !important;
  font-variation-settings: 'FILL' 1;
  pointer-events: none;

  .icons-only & {
    top: 20px;
  }
`

export const Item = styled(Link)`
  ${itemStyles}

  /* its addon isn't usable here: faded, its page explains the addon */
  &.unavailable > .icon:not(${ItemEye}):not(${LicenseBolt}),
  &.unavailable > ${Label} {
    opacity: 0.38;
  }

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

  & > .icon:not(${ItemEye}):not(${LicenseBolt}),
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
  /* in the context's colour, at Home and in a project */
  .tinted & .icon {
    color: var(--rail-tint);
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

  .icons-only & {
    width: ${ICON_ITEM}px;

    ${Label} {
      display: none;
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

// --- groups of items (an arrangement's folders)

// a group on the sidebar: its tile, and its items over the ones below while it is open
export const FolderWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
`

// the group's tile: its first items' icons in a square, its name below
export const FolderTile = styled.button`
  ${itemStyles}
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;

  &.open {
    background-color: var(--color-nav-hover);
  }
`

export const FolderIcons = styled.span`
  display: grid;
  grid-template-columns: repeat(2, 13px);
  grid-auto-rows: 13px;
  gap: 1px;
  padding: 3px;
  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-highest);

  .icon {
    font-size: 13px;
  }
  .active & .icon {
    color: var(--md-sys-color-primary);
  }
  .tinted .active & .icon {
    color: var(--rail-tint);
  }
`

// the group's items, over the items below it (or above, near the sidebar's end)
export const FolderPanel = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 2px 0;
  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-high);
  box-shadow: var(--md-sys-elevation-overlay);

  &.up {
    top: auto;
    bottom: 100%;
  }
`

// while editing: a group open in place, its name and Ungroup on top
export const EditFolder = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: ${ITEM_WIDTH}px;
  padding-bottom: 2px;
  border: 1px dashed var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-l);

  .icons-only & {
    width: ${ICON_ITEM}px;
  }
`

// its name on its own line under the group icon and Ungroup, so a long one fits
export const FolderHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  row-gap: 1px;
  width: ${ITEM_WIDTH - 2}px;
  padding: 3px 3px 0;
  cursor: grab;

  .icon {
    font-size: 16px;
    color: var(--md-sys-color-on-surface-variant);
  }
  input,
  & > ${Label} {
    grid-column: 1 / -1;
    min-width: 0;
    padding: 1px 2px;
    border: 1px solid transparent;
    border-radius: var(--border-radius-m);
    background: none;
    color: var(--md-sys-color-on-surface);
    font: inherit;
    font-size: 11px;
    font-weight: 500;
    text-align: center;

    &:hover,
    &:focus {
      border-color: var(--md-sys-color-outline-variant);
      outline: none;
    }
  }
  /* beside the group icon */
  button {
    grid-row: 1;
    grid-column: 2;
    display: flex;
    padding: 1px;
    border: none;
    border-radius: var(--border-radius-m);
    background: none;
    cursor: pointer;

    &:hover {
      background-color: var(--md-sys-color-surface-container-highest);
    }
  }

  .icons-only & {
    width: ${ICON_ITEM - 2}px;
    padding: 2px 1px 0;

    input {
      display: none;
    }
  }
`

// while dragging: where the dragged entry goes (a line before or after, a ring into)
export const DropHint = styled.div`
  &.drop-before::before,
  &.drop-after::after {
    content: '';
    position: absolute;
    left: 4px;
    right: 4px;
    height: 2px;
    border-radius: 1px;
    background-color: var(--md-sys-color-primary);
    z-index: 2;
  }
  &.drop-before::before {
    top: -2px;
  }
  &.drop-after::after {
    bottom: -2px;
  }
  &.drop-into {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
    border-radius: var(--border-radius-l);
  }
`

// a dragged entry's place stays, faded; the hint shows where it would go
export const DraggableEntry = styled(DropHint)`
  position: relative;
  flex-shrink: 0;
  touch-action: none;

  &.dragging {
    opacity: 0.4;
  }
`

// what follows the pointer while dragging
export const DragChip = styled.div`
  ${itemStyles}
  background-color: var(--md-sys-color-surface-container-highest);
  box-shadow: var(--md-sys-elevation-overlay);
  opacity: 0.95;
  cursor: grabbing;
`
