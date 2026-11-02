import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import type { SimpleFormField } from '@shared/api'

const LabelContainer = styled.div`
  &.normal {
    // maybe something here
  }

  &.info,
  &.warning,
  &.error {
    padding: 0.5rem;
    text-align: center;
    font-weight: bold;
    margin: 1rem 0;
  }

  &.info {
    background-color: var(--md-sys-color-on-secondary-dark);
  }
  &.warning {
    background-color: var(--md-sys-color-warning-container-dark);
  }
  &.error {
    background-color: var(--md-sys-color-on-error-dark);
  }
`

export interface FormLabelProps {
  field: SimpleFormField
}

export const FormLabel = ({ field }: FormLabelProps) => {
  const text = typeof field.value === 'string' ? field.value : 'Invalid label value'

  return (
    <LabelContainer className={field.highlight || 'normal'}>
      <ReactMarkdown>{text}</ReactMarkdown>
    </LabelContainer>
  )
}
