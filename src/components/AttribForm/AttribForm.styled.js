import styled from 'styled-components'

export const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 4px;

  overflow: auto;
  padding: 1px;
`

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;

  align-items: center;
  justify-content: space-between;

  input {
    min-width: 200px;
  }
`
