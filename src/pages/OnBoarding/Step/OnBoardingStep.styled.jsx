import { Panel } from '@ynput/ayon-react-components'
import styled from 'styled-components'

// import some styles from LoginPage and export them as Styled
export * from '/src/pages/LoginPage/LoginPage.styled'

export const StepPanel = styled(Panel)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 32px;
  position: relative;
  background-color: var(--color-grey-00);
  padding: 64px;
  border-radius: 6px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25);

  h2 {
    font-size: 24px;
    text-align: center;
  }
`

export const Login = styled.section`
  display: flex;
  width: 300px;
  flex-direction: column;
  align-items: center;
  gap: 16px;

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

  .skip {
    margin-top: 16px;
    /* underline */
    text-decoration: underline;
    cursor: pointer;
  }
`

export const PresetsContainer = styled.ul`
  display: flex;
  width: 470px;
  max-width: 470px;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0;
`

export const Footer = styled.footer`
  display: flex;
  gap: 8px;
  width: 100%;
  justify-content: flex-end;

  button {
    padding: 8px 16px;
    min-height: unset;
    min-width: unset;
    max-width: unset;
    max-height: unset;
  }
`
