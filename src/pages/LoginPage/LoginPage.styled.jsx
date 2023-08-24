import styled from 'styled-components'

export const LoginForm = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 64px;
  position: relative;
  background-color: var(--panel-background);
  padding: 64px;
  border-radius: 6px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25);

  /* panel */
  & > div {
    align-items: center;
    padding: 32px;
    gap: 32px;
    width: 350px;

    p {
      margin: 0;
      text-align: center;

      a {
        text-decoration: underline;
      }
    }
  }

  /* company */
  & > div:first-child {
    p {
      text-align: left;
    }
  }

  /* login */
  & > div:last-child {
    background-color: var(--color-grey-01);
  }

  button {
    padding: 8px 12px;
    height: 40px;
    max-height: unset;

    svg {
      width: 24px;
    }

    span {
      font-size: 24px !important;
    }
  }

  /* name password form */
  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 8px;

    & > * {
      width: 100%;
    }
  }
`

export const Methods = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px;
  gap: 16px;
  width: 100%;

  a,
  button {
    width: 100%;
  }
`

// AYON Logo
export const Ayon = styled.img`
  height: 60px;
`
export const Logo = styled.img`
  height: 60px;
`

export const BG = styled.img`
  position: fixed;
  z-index: -10;
  object-fit: cover;
  width: 100vw;
  height: 100vh;
`
