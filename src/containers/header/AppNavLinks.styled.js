import styled from 'styled-components'

export const NavBar = styled.nav`
    padding-right: 8px;
    background-color: var(--panel-background);
    padding: 0 8px;
    position: relative;
    display: flex;
    
    .scrollable-tabs {
        flex: 1;
        overflow-x: auto;
        /* hide scroll bar */
        scrollbar-width: none;
        -ms-overflow-style: none;
        &::-webkit-scrollbar {
            display: none;
        }

        ul {
            border-bottom: 1px solid var(--md-sys-color-outline-variant);
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: var(--base-gap-small);
            /* reset defaults */
            list-style: none;
            margin: 0;
            padding: 0;

            /* this hides the border of the navbar by putting the active tab border over it */
            position: relative;
        }
    }

    .fixed-buttons {
        display: flex;
        align-items: center;
        gap: var(--base-gap-small);
        position: relative;
        background-color: var(--panel-background);
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        z-index: 2;

        @media (min-width: 1200px) {
            position: static;
            background-color: transparent;
            padding-left: 0;
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
    border: 1px solid transparent;
    border-radius: 4px 4px 0 0;
    margin-bottom: -1px;

    button {
      padding: 4px 16px;
      max-height: unset;
    }

    &.active {
      background-color: var(--md-sys-color-background);
      border: 1px solid var(--md-sys-color-outline-variant);
 

      button {
        &:hover {
          background-color: unset;
        }
      }

      border-bottom: 1px solid var(--md-sys-color-background);
    }
  }
`

export const Views = styled.span`
  display: flex;
  align-items: center;
  margin-left: -8px;
`
