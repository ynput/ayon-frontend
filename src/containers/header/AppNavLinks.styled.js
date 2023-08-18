import styled from 'styled-components'

export const NavBar = styled.nav`
  background-color: var(--color-grey-00);
  padding-right: 8px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  /* FIX: these needs to be changed to new theme */
  background-color: var(--color-grey-00);
  padding: 0 8px;

  ul {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    /* reset defaults */
    list-style: none;
    margin: 0;
    padding: 0;

    /* this hides the border of the navbar by putting the active tab border over it */
    position: relative;
    top: 1px;
  }
`

export const NavItem = styled.li`
  /* NavLink */
  a {
    padding: 2px 4px;
    padding-bottom: 4px;
    display: block;
    border: 1px solid transparent;
    border-radius: 4px 4px 0 0;

    /* this will be fixed with theme buttons */
    button {
      background-color: unset;
      padding: 4px 16px;
      max-height: unset;

      &:hover {
        background-color: var(--color-grey-01);
      }

      /* temp fix */
      &:focus {
        outline: none;
      }
    }

    &.active {
      background-color: var(--color-grey-01);
      border: 1px solid var(--md-sys-color-outline-variant);
      border-bottom: 1px solid var(--color-grey-01);

      button {
        &:hover {
          background-color: unset;
        }
      }
    }
  }
`
