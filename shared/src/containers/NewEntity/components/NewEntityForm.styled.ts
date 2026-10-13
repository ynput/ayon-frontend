import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'

export const InputLabel = styled.label`
  font-size: ${theme.labelMedium};
  color: var(--md-sys-color-outline);
`
export const InputsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--base-gap-small);

  label {
    white-space: nowrap;
  }

  [icon='info'] {
    cursor: help;
    font-size: 16px;
    color: var(--md-sys-color-outline);
  }
`

export const NameRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 6px;
  gap: var(--base-gap-small);
  width: 100%;
  word-break: break-all;
`
