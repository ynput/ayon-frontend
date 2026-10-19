import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
`

export const Summary = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  color: var(--md-sys-color-outline);
`

export const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);

  h3 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--md-sys-color-outline);
  }
`

export const Section = styled.div`
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container);
  overflow: hidden;
`

export const SectionHeader = styled.button`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  width: 100%;
  padding: 6px 8px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface);
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  .name {
    font-weight: 600;
  }

  .id {
    margin-left: auto;
    font-family: monospace;
    color: var(--md-sys-color-outline);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

export const SectionBody = styled.div`
  padding: 4px 8px 8px 32px;
`

export const Tag = styled.span`
  padding: 0 6px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface);
  font-size: 0.85rem;
  white-space: nowrap;

  &.warning {
    background-color: var(--md-sys-color-warning-container);
    color: var(--md-sys-color-on-warning-container);
  }

  &.error {
    background-color: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
  }
`

export const FieldTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  td {
    padding: 3px 8px 3px 0;
    vertical-align: top;
  }

  td.label {
    width: 1%;
    white-space: nowrap;
    color: var(--md-sys-color-outline);

    &.extra {
      font-style: italic;
    }
  }

  td.value {
    word-break: break-word;
  }

  .mismatch {
    color: var(--md-sys-color-warning);
    font-size: 16px;
    vertical-align: middle;
    margin-left: 4px;
  }
`

export const Empty = styled.span`
  color: var(--md-sys-color-outline);
  font-style: italic;
`

export const Code = styled.code`
  font-family: monospace;
  word-break: break-all;
`

export const List = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;

  & > li {
    padding: 4px 8px;
    border-radius: var(--border-radius-m);
    background-color: var(--md-sys-color-surface-container-high);
  }
`

export const InlineList = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
`

export const Details = styled.details`
  summary {
    cursor: pointer;
    color: var(--md-sys-color-outline);
  }
`

export const TextToggle = styled.button`
  padding: 0;
  border: none;
  background: none;
  color: var(--md-sys-color-primary);
  font: inherit;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`
