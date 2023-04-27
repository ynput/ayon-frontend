import React from 'react'
import ReactDatePicker from 'react-datepicker'
import styled from 'styled-components'
import './InputDate.scss'

const StyledInputDate = styled(ReactDatePicker)`
  width: 100%;

  color: var(--color-text);
  border: 1px solid var(--color-grey-03);
  background-color: var(--color-grey-00);
  border-radius: var(--base-input-border-radius);
  min-height: var(--base-input-size);
  max-height: var(--base-input-size);
  padding: 0 5px;

  &:focus {
    outline: 1px solid var(--color-hl-00);
  }

  &.error,
  &:invalid {
    border-color: var(--color-hl-error);
  }

  &:disabled {
    color: var(--color-text-dim);
    background-color: var(--input-disabled-background-color);
    border-color: var(--input-disabled-border-color);
    font-style: italic;
    cursor: not-allowed;
  }

  /* spread style */
  ${({ style }) => style}
`

const InputDate = ({ style, ...props }) => {
  return <StyledInputDate {...props} style={style} dateFormat="dd/MM/yyyy" />
}

export default InputDate
