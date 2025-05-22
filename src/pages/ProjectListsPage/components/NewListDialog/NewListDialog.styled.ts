import styled from 'styled-components'

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
`

export const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
`

export const Footer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`

export const Error = styled.div`
  color: var(--md-sys-color-error);
`
