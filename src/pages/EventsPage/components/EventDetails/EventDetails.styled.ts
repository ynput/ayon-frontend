import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'

export const Panel = styled.aside`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-low);

  .muted {
    color: var(--md-sys-color-on-surface-variant);
    ${theme.bodySmall}
  }

  .mono {
    font-family: monospace;
    word-break: break-all;
  }

  button:focus-visible,
  summary:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 1px;
  }
`

export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 4px 4px 12px;
  min-height: 44px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);

  h2 {
    flex: 1;
    margin: 0 0 0 4px;
    ${theme.titleMedium}
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

export const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const Description = styled.p`
  margin: 0;
  ${theme.bodyLarge}
  word-break: break-word;
  user-select: text;
`

export const Facts = styled.dl`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  margin: 0 -6px;

  /* one row per fact, a subgrid keeps the labels in one column */
  .fact {
    position: relative;
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;
    column-gap: 16px;
    align-items: baseline;
    padding: 6px;
    border-radius: var(--border-radius-m);

    &:hover,
    &:focus-within {
      background-color: var(--md-sys-color-surface-container);

      .actions {
        opacity: 1;
        pointer-events: auto;
      }
    }
  }

  dt {
    ${theme.labelMedium}
    color: var(--md-sys-color-on-surface-variant);
  }

  dd {
    margin: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    ${theme.bodyMedium}
    user-select: text;
    overflow-wrap: anywhere;
  }

  .mono {
    ${theme.bodySmall}
    font-family: monospace;
  }

  /* shown on row hover, over the end of the value so it keeps the full width */
  .actions {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 2px;
    border-radius: var(--border-radius-m);
    background-color: var(--md-sys-color-surface-container);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.1s;

    a {
      display: flex;
    }

    button {
      max-height: 28px;
      padding: 4px;

      .icon {
        font-size: 20px;
      }
    }
  }

  .with-icon {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .status {
    .icon {
      font-size: 18px;
    }
    &.failed {
      color: var(--md-sys-color-error);
    }
    &.pending,
    &.in_progress {
      color: var(--md-sys-color-primary);
    }
  }
`

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;

  & > button {
    align-self: flex-start;
  }
`

export const SectionTitle = styled.h3`
  margin: 0;
  ${theme.labelLarge}
  color: var(--md-sys-color-on-surface-variant);
`

export const Hint = styled.span`
  ${theme.bodySmall}
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.8;
`

export const Pre = styled.pre`
  margin: 0;
  padding: 8px;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container);
  ${theme.bodySmall}
  font-family: monospace;
  user-select: text;

  &.error {
    color: var(--md-sys-color-on-error-container);
    background-color: var(--md-sys-color-error-container);
  }
`

export const EventList = styled.div`
  display: flex;
  flex-direction: column;
`

export const EventLink = styled.button`
  display: grid;
  grid-template-columns: 18px 62px minmax(60px, max-content) minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 4px 6px;
  border: none;
  border-radius: var(--border-radius-m);
  background: transparent;
  color: var(--md-sys-color-on-surface);
  text-align: left;
  cursor: pointer;
  ${theme.bodySmall}

  .icon {
    font-size: 16px;
  }

  .time {
    font-variant-numeric: tabular-nums;
    color: var(--md-sys-color-on-surface-variant);
  }

  .topic,
  .description {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .description {
    color: var(--md-sys-color-on-surface-variant);
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &.current {
    cursor: default;
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
  }
`

export const Disclosure = styled.details`
  summary {
    display: flex;
    align-items: center;
    gap: var(--base-gap-small);
    cursor: pointer;
    ${theme.labelLarge}
    color: var(--md-sys-color-on-surface-variant);
    padding: 4px 0;
    list-style: none;
  }

  /* hides the native triangle in webkit */
  summary::-webkit-details-marker {
    display: none;
  }

  &[open] .expand {
    transform: rotate(90deg);
  }

  & > div {
    margin-top: 6px;
    max-height: 400px;
  }
`
