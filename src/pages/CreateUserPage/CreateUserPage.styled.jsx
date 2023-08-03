import { Panel as PanelComp } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const BG = styled.img`
  position: fixed;
  z-index: -10;
  object-fit: cover;
  width: 100vw;
  height: 100vh;
`

export const Ayon = styled.img`
  height: 60px;
`

export const Panel = styled(PanelComp)`
  position: relative;
  background-color: var(--color-grey-00);
  padding: 64px;
  border-radius: 6px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25);
`

export const Form = styled.form`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 300px;
  width: 100%;
  gap: 8px;

  h1 {
    font-size: 24px;
  }

  & > div {
    width: 100%;
  }

  .save {
    margin-left: auto;
    margin-top: 8px;
  }

  input:invalid {
    border-color: var(--color-grey-03);
  }
`

export const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
  width: 100%;

  input {
    width: 100%;
  }
`

export const Error = styled.span`
  color: var(--color-hl-error);

  position: absolute;
  bottom: -32px;
`
