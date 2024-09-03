import styled from 'styled-components'

const SubRow = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;

  > *:first-child {
    flex-grow: 1;
    margin-right: 4px;

    /* reveal null button on hover */
    &:hover + .null {
      display: block;
    }
  }

  /* set to null button */
  .null {
    background-color: unset;
    position: absolute;
    right: 24px;
    padding: 2px;
    top: 4px;

    display: none;
    &:hover {
      display: block;
      background-color: unset;
    }
  }

  &.isChanged {
    .null {
      color: var(--color-on-changed);
    }
  }
`

export { SubRow }
