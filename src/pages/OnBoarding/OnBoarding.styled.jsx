import styled from 'styled-components'

// import some styles from LoginPage and export them as Styled
export * from '/src/pages/LoginPage/LoginPage.styled'

export const Login = styled.section`
  display: flex;
  width: 300px;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  h2 {
    font-size: 24px;
    text-align: center;
  }

  button {
    margin-top: 8px;
  }

  .more {
    margin-top: 16px;
    /* underline */
    text-decoration: underline;
    cursor: pointer;
  }
`

export const More = styled.section`
  display: flex;
  flex-direction: column;
  /* gap: 16px; */
  width: 350px;

  /* border right */
  border-right: 2px solid var(--color-grey-01);
  padding-right: 32px;

  h2 {
    font-size: 24px;
    text-align: center;
  }

  .skip {
    margin-top: 16px;
    /* underline */
    text-decoration: underline;
    cursor: pointer;
  }
`
