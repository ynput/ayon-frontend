import styled from 'styled-components'

export const NavBar = styled.nav`
  padding-right: 8px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--panel-background);
  padding: 0 8px;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
`

export const ScrollableNav = styled.div`
  flex: 1;
  overflow-x: auto;
  /* hide scroll bar */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }

  ul {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--base-gap-small);

    list-style: none;
    margin: 0;
    padding: 0;

    position: relative;
    top: 1px;
    margin-bottom: -1px;

    & > li {
      flex-shrink: 0;
    }
  }
`

export const HelpButtonContainer = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;

  position: relative;
  top: 1px;
  margin-bottom: -1px;
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
