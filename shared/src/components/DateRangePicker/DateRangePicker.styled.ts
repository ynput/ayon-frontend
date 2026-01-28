import { Button, Icon, theme } from '@ynput/ayon-react-components'
import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

export const Container = styled.div`
  position: relative;
  display: inline-flex;
`

export const Trigger = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* Default styling for value display */
  .date-value {
    cursor: pointer;
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 0.85em;
    color: var(--md-sys-color-outline);

    &:hover {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
  }

  /* Empty state styling */
  &.empty {
    width: 24px;
    height: 24px;
  }
`

export const DefaultEmptyTrigger = styled(Icon)`
  width: 20px;
  height: 20px;
  min-width: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  border: 1px dashed var(--md-sys-color-outline);
  cursor: pointer;
  font-size: 14px;
  color: var(--md-sys-color-outline);

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }
`

export const Dropdown = styled.div`
  position: fixed;
  z-index: 1001;
  background-color: var(--md-sys-color-surface-container-highest);
  border-radius: var(--border-radius-l);
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 0.15s ease-out;

  &.right {
    transform-origin: top right;
  }

  &.left {
    transform-origin: top left;
  }
`

export const DropdownContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  padding: var(--padding-m);
  position: relative;
`

export const CloseButton = styled(Button)`
  &.hasIcon {
    padding: 4px;
  }
  position: absolute;
  top: 2px;
  right: 2px;
  background: none;
  .icon {
    font-size: 18px;
    color: var(--md-sys-color-outline);
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }
`

export const DateField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    ${theme.labelSmall}
    color: var(--md-sys-color-outline);
  }
`

export const DateInput = styled.input`
  background-color: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-m);
  padding: var(--padding-s) var(--padding-m);
  ${theme.bodySmall}
  color: var(--md-sys-color-on-surface);
  cursor: pointer;

  &:hover {
    border-color: var(--md-sys-color-outline);
  }

  &:focus {
    outline: none;
    border-color: var(--md-sys-color-primary);
  }

  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: invert(0.5);
  }
`

export const ClearButton = styled(Button)`
  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }
`
