import styled from 'styled-components'

export const NavBar = styled.nav`
  padding-right: 8px;
  /* the line the tabs stand on, the edge of the page */
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-background);
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

  ul.tabs {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    /* hide scroll bar */
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }

    /* fade the edge where more tabs are hidden */
    --fade-start: 0px;
    --fade-end: 0px;
    &.overflow-start {
      --fade-start: 48px;
    }
    &.overflow-end {
      --fade-end: 48px;
    }
    &.overflow-start,
    &.overflow-end {
      mask-image: linear-gradient(
        to right,
        transparent 0,
        #000 var(--fade-start),
        #000 calc(100% - var(--fade-end)),
        transparent 100%
      );
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
    }

    /* each name keeps the width of its semibold form, so the tabs don't move when the active one changes */
    .tab-name {
      display: inline-flex;
      flex-direction: column;

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

        &:hover {
          background-color: unset;
        }
      }
    }
  }
`

export const Views = styled.span`
  display: flex;
  align-items: center;
  margin-left: -8px;
`
