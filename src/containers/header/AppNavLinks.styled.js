import styled from 'styled-components'

export const NavBar = styled.nav`
  padding-right: 8px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--panel-background);
  padding: 0 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--base-gap-small);
  /* this hides the border of the navbar by putting the active tab border over it */
  position: relative;
  top: 1px;
  margin-bottom: -1px;
`

export const NavLinksContainer = styled.div`
  overflow: hidden;

  ul {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--base-gap-small);
    /* reset defaults */
    list-style: none;
    margin: 0;
    padding: 0;
    /* overflow */
    width: 100%;
    overflow-x: auto;
    /* hide scroll bar */
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`

export const NavRightActions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--base-gap-small);
  flex-shrink: 0; /* Prevent shrinking */
  margin-left: auto; /* Push to the right */
  /* Ensure action buttons are always visible */
  z-index: 1;
  position: relative;
  padding-left: 4px;
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

    /* this will be fixed with theme buttons */
    button {
      padding: 4px 16px;
      max-height: unset;
    }

    &.active {
      background-color: var(--md-sys-color-background);
      border: 1px solid var(--md-sys-color-outline-variant);
      border-bottom: 1px solid var(--color-grey-01);

      button {
        &:hover {
          background-color: unset;
        }
      }

      border-bottom: 1px solid var(--md-sys-color-background);
    }
  }
`
