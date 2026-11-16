import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

// the context pill: project, path to the selected entity and a copy button
export const Pill = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  height: 32px;
  border-radius: var(--border-radius-m);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-highest);

  /* no project and nothing selected */
  &.empty {
    opacity: 0.4;
    &:hover,
    &:focus-within {
      opacity: 1;
    }
  }
`

export const Display = styled.button`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  min-width: 0;
  height: 100%;
  padding: 6px 4px 6px 12px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface);
  cursor: text;
  white-space: nowrap;

  font-family: var(--md-sys-typescale-body-large-font-family-name);
  font-size: 14px;
  line-height: 20px;

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  .icon {
    font-size: 18px;
  }
`

export const Text = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;

  strong {
    font-weight: 700;
  }
`

export const Form = styled.form`
  display: flex;
  align-items: center;
  height: 100%;
  min-width: 0;

  input {
    height: 100%;
    min-width: 240px;
    max-width: 50vw;
    field-sizing: content;
    padding: 6px 12px;
    border-radius: var(--border-radius-m) 0 0 var(--border-radius-m);
    background-color: var(--md-sys-color-surface-container-high);
    border: 1px solid var(--md-sys-color-outline);
    outline: none;
    font-size: 14px;
  }
`

export const PillButton = styled(Button)`
  height: 100%;
  padding: 6px;
  border-radius: 0;
  background-color: transparent;

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  &:disabled {
    background-color: transparent;
  }
`
