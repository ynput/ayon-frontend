import styled from 'styled-components'

export const Crumbtainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;

  ul {
    cursor: pointer;
    list-style: none;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    margin: 0;
    padding: 0;

    & > li {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4em;

      &:not(:last-child) {
        &::after {
          margin: 0 5px;
          content: '/';
        }
      }
    }
  }
`
