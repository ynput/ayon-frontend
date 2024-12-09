import { Button } from '@ynput/ayon-react-components'
import styled, { keyframes } from 'styled-components'

export const Container = styled.div`
  padding: 6px 12px;
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: var(--border-radius-m);
  border: 1px solid transparent;
  display: inline-flex;
  justify-content: start;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
  user-select: none;

  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);

    border-color: var(--md-sys-color-primary);
  }

  &.loading {
    cursor: default;
    &:hover {
      background-color: var(--md-sys-color-surface-container-low);
    }
  }
`

export const Content = styled.div`
  display: inline-flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
  min-height: 40px;
  flex: 1;
`

export const TitleWrapper = styled.div`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: var(--base-gap-small);
`

export const Title = styled.div``

export const AuthorWrapper = styled.div`
  display: inline-flex;
  justify-content: center;
  align-items: center;
`

export const Author = styled.div``

export const Buttons = styled.div`
  display: inline-flex;
  justify-content: flex-end;
  flex: 1;
`

const SpinAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg)
  }
`

export const Tag = styled(Button)`
  border-radius: var(--border-radius-l);
  min-width: 75px;

  gap: var(--base-gap-small);

  &.downloaded,
  &.downloading,
  &.pending,
  &.updating,
  &.finished {
    background-color: unset;
    user-select: none;
  }

  &.downloaded {
    opacity: 0.5;
    font-style: italic;
  }

  &.downloading,
  &.updating {
    .icon {
      user-select: none;
      animation: ${SpinAnimation} 1s linear infinite;
    }
  }

  &.finished {
    user-select: none;
  }
`
