import { getShimmerStyles } from '@ynput/ayon-react-components'
import styled, { keyframes } from 'styled-components'

export const Container = styled.div`
  padding: 6px 12px;
  background-color: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-surface-container-low);
  border-bottom-color: var(--md-sys-color-outline-variant);
  display: inline-flex;
  justify-content: start;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;

  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }

  &.isSelected {
    background-color: var(--md-sys-color-primary-container);

    border-radius: var(--border-radius-m);
    border-color: var(--md-sys-color-primary);
  }

  &.isPlaceholder {
    ${getShimmerStyles()}

    .content {
      border-radius: var(--border-radius-m);
      overflow: hidden;
      position: relative;
      ${getShimmerStyles(undefined, undefined, { opacity: 1 })}
    }
  }
`

export const Content = styled.div`
  display: inline-flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
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

export const Tag = styled.div`
  user-select: none;
  padding: 4px 12px;
  border-radius: var(--border-radius-l);
  min-width: 75px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--base-gap-small);

  &.update {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
  &.install {
    background-color: var(--md-sys-color-surface-container-high);
  }

  &.installed {
    opacity: 0.5;
    font-style: italic;
  }

  &.installing .icon {
    animation: ${SpinAnimation} 1s linear infinite;
  }
`
