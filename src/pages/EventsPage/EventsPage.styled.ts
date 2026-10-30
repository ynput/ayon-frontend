import styled, { keyframes } from 'styled-components'
import { theme } from '@ynput/ayon-react-components'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const progress = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(250%); }
`

export const Page = styled.main`
  position: relative;
  display: flex;
  gap: var(--base-gap-large);
  height: 100%;
  overflow: hidden;

  .spin {
    animation: ${spin} 1s linear infinite;
  }
`

export const FiltersColumn = styled.div`
  width: 264px;
  flex-shrink: 0;
  min-height: 0;

  .narrow & {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 20;
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.4);
  }
`

export const Scrim = styled.div`
  position: absolute;
  inset: 0;
  z-index: 19;
  background-color: rgba(0, 0, 0, 0.3);
`

export const MainColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
`

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  flex-wrap: wrap;

  & > button {
    position: relative;
  }
`

export const Badge = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  font-size: 10px;
  line-height: 16px;
  font-weight: 600;
`

export const ViewSwitch = styled.div`
  display: flex;
  flex-shrink: 0;
  padding: 2px;
  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-low);

  button {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    border: none;
    border-radius: var(--border-radius-m);
    background: transparent;
    color: var(--md-sys-color-on-surface-variant);
    cursor: pointer;
    ${theme.labelLarge}

    .icon {
      font-size: 18px;
    }

    &:hover {
      color: var(--md-sys-color-on-surface);
      background-color: var(--md-sys-color-surface-container-hover);
    }

    &.active {
      background-color: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }

    &:focus-visible {
      outline: 2px solid var(--md-sys-color-primary);
    }
  }
`

export const Status = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  ${theme.labelMedium}
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;

  .icon {
    font-size: 16px;
  }
`

export const Content = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  /* refetching for new filters: keep the old result, show a thin progress bar instead of a spinner */
  &.stale::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 40%;
    height: 2px;
    z-index: 30;
    background-color: var(--md-sys-color-primary);
    animation: ${progress} 1.2s ease-in-out infinite;
  }
  &.stale {
    overflow: hidden;
  }
  &.stale > * {
    opacity: 0.7;
    transition: opacity 150ms;
  }
`

export const Loading = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--md-sys-color-on-surface-variant);
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-low);
`

export const DetailsColumn = styled.div`
  width: 400px;
  flex-shrink: 0;
  min-height: 0;

  .narrow & {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: min(400px, 100%);
    z-index: 18;
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.4);
  }
`
