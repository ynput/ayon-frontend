import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

export const NavBar = styled.nav`
  padding-right: 8px;
  /* the line the tabs stand on, the edge of the page */
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container-low);
  padding: 0 8px;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  ul {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--base-gap-small);
    /* reset defaults */
    list-style: none;
    margin: 0;
    padding: 0;

    /* this puts the active tab's underline over the navbar's line */
    position: relative;
    top: 1px;
    margin-bottom: -1px;
  }

  ul.trailing {
    flex-shrink: 0;
  }

  /* tabs that don't fit fold into the "+N" menu, so the row never scrolls */
  ul.tabs {
    flex: 1;
    min-width: 0;
    overflow: hidden;

    /* tabs keep their width, which is what the row measures to fold them */
    & > li {
      flex-shrink: 0;
    }
  }
`

export const NavItem = styled.li`
  user-select: none;
  /* NavLink */
  a {
    padding: 2px 4px;
    padding-bottom: 4px;
    display: block;

    /* this will be fixed with theme buttons */
    button {
      padding: 4px 16px;
      max-height: unset;
      /* the active tab is the one in semibold */
      font-weight: 500;

      /* a shade behind the name, the active tab too, clear of the underline */
      &:hover {
        background-color: var(--color-nav-hover);
      }
      &:active {
        background-color: var(--color-nav-active);
      }
    }

    /* each name keeps the width of its semibold form, so the tabs don't move when the active one changes */
    .tab-name {
      display: inline-flex;
      flex-direction: column;
      /* an addon's long title can't take the row: the tabs fold by these widths */
      max-width: 240px;

      .tab-label,
      &::after {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &::after {
        content: attr(data-name);
        font-weight: 600;
        height: 0;
        overflow: hidden;
        visibility: hidden;
        user-select: none;
        pointer-events: none;
      }
    }

    /* the active tab is underlined in the accent colour, on the navbar's line */
    &.active {
      box-shadow: inset 0 -2px 0 0 var(--md-sys-color-primary);

      button {
        font-weight: 600;
      }
    }
  }
`

export const Views = styled.span`
  display: flex;
  align-items: center;
  margin-left: -8px;
`

export const MoreTabs = styled(Button)`
  flex-shrink: 0;
  padding: 4px 6px 4px 10px;
`
