import styled from 'styled-components'

export const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
  padding: 0 6px;
  border-radius: var(--border-radius-m);
  line-height: 20px;
  white-space: nowrap;

  &.has-icon {
    padding-left: 4px;
  }

  /* no colour: the value as plain text */
  &.plain {
    padding: 0;
  }

  .icon {
    flex-shrink: 0;
    font-size: 16px;
    color: inherit;
    font-variation-settings: 'FILL' 1;
  }

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`
