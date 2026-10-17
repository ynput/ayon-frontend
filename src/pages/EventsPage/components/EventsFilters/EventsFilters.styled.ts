import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'

export const Panel = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
  padding: 8px 8px 16px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-low);

  input[type='checkbox'] {
    accent-color: var(--md-sys-color-primary);
    margin: 0;
    width: 14px;
    height: 14px;
  }

  button:focus-visible,
  input:focus-visible,
  label:focus-within {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 1px;
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

export const CheckList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px;
    border-radius: var(--border-radius-m);
    cursor: pointer;

    &:hover {
      background-color: var(--md-sys-color-surface-container-hover);
    }
  }

  .icon {
    font-size: 18px;
  }

  .label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    ${theme.labelSmall}
    color: var(--md-sys-color-on-surface-variant);
    font-variant-numeric: tabular-nums;
  }
`

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`

export const ToggleChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-height: 28px;
  padding: 2px 8px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-l);
  background-color: transparent;
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  ${theme.labelMedium}

  .icon {
    font-size: 16px;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &.active {
    border-color: transparent;
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);

    &:hover {
      background-color: var(--md-sys-color-secondary-container-hover);
    }
  }
`

export const Segmented = styled.div`
  display: flex;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-m);
  overflow: hidden;

  button {
    flex: 1;
    padding: 4px 0;
    border: none;
    background: transparent;
    color: var(--md-sys-color-on-surface);
    cursor: pointer;
    ${theme.labelMedium}

    & + button {
      border-left: 1px solid var(--md-sys-color-outline-variant);
    }

    &:hover {
      background-color: var(--md-sys-color-surface-container-hover);
    }

    &.active {
      background-color: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }
  }
`

export const DateRow = styled.div`
  & > div {
    width: 100%;
  }

  /* the shared picker trigger is icon sized by default, make it a full width field */
  && > div > button {
    width: 100%;
    height: 32px;
    padding: 0 8px;
    justify-content: flex-start;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--border-radius-m);
  }
`

export const DateTrigger = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  ${theme.labelMedium}

  .icon {
    font-size: 18px;
  }
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
