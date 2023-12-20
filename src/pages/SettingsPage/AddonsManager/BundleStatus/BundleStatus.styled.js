import styled from 'styled-components'

export const StatusDots = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;

  span {
    font-size: 2rem;
  }

  .wrapper {
    width: 30px;
    display: flex;
    justify-content: flex-end;
  }

  span:not(:first-child) {
    margin-left: -7px; // Adjust this value as needed
  }
`
