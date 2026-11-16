import styled from 'styled-components'
import { Button, theme } from '@ynput/ayon-react-components'

export const Panel = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
  padding: 8px 8px 16px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-low);

  button:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 1px;
  }
`

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  padding-left: 4px;

  h2 {
    ${theme.titleMedium}
    margin: 0;
  }
`

export const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: 6px;

  & > .input,
  input[type='text'],
  form {
    width: 100%;
  }
`

export const GroupTitle = styled.h3`
  ${theme.labelLarge}
  margin: 0;
  padding-left: 4px;
  color: var(--md-sys-color-on-surface-variant);
`

export const Hint = styled.span`
  ${theme.bodySmall}
  padding-left: 4px;
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.8;
`

export const Options = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
`

// same look as the SearchFilter dropdown rows
export const Option = styled.button`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  width: 100%;
  padding: 6px;
  border: none;
  border-radius: var(--border-radius-m);
  background-color: transparent;
  color: var(--md-sys-color-on-surface);
  text-align: left;
  cursor: pointer;
  user-select: none;

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    ${theme.labelSmall}
    color: var(--md-sys-color-on-surface-variant);
    font-variant-numeric: tabular-nums;
  }

  /* always takes up its space so the counts line up and don't shift on selection */
  .check {
    visibility: hidden;
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);

    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);
    }

    .check {
      visibility: visible;
    }

    .count {
      color: inherit;
    }
  }
`

export const Presets = styled.div`
  display: flex;
  gap: var(--base-gap-small);

  button {
    flex: 1;
  }
`

export const DateFields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--base-gap-small);
`

export const TopicCount = styled.span`
  ${theme.labelSmall}
  margin-left: auto;
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
`

export const UserValue = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export const EntityButton = styled(Button)`
  width: 100%;
  justify-content: flex-start;
  overflow: hidden;
  white-space: nowrap;
`

export const Toggle = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px;
  ${theme.bodySmall}
  color: var(--md-sys-color-on-surface-variant);
`
