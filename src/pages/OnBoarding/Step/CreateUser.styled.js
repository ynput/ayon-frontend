import styled from 'styled-components'

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  height: 100%;
`

export const Form = styled.form`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 300px;
  gap: var(--base-gap-large);

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
    border-color: var(--md-sys-color-outline-variant);
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
  bottom: 16px;
`
