import styled, { css } from 'styled-components'
import { Link } from 'react-router-dom'

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
`

export const Item = styled(Link)`
  ${itemStyles}
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

// More: a button styled as an item
export const MoreItem = styled.button`
  ${itemStyles}
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
`

// where More's menu opens: beside the rail, level with the item
export const MoreAnchor = styled.span`
  position: absolute;
  left: calc(100% + 4px);
  top: -8px;
  width: 0;
  height: 0;
`
