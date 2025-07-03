import styled from 'styled-components'

export const ReviewablesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  min-height: 100%;
  padding-bottom: var(--padding-m);
  width: 100%;
  height: 100%;
  &.large {
    justify-content: center;
    padding: 0 25%;
    padding-bottom: 30%;
  }

  &.dragging {
    opacity: 0;
  }
`

export const Upload = styled.div`
  position: relative;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;

  background-color: var(--md-sys-color-surface-container-low);

  border-radius: var(--border-radius-xxl);
  border: 2px dashed var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-outline-variant);
  &.large {
    height: 80px;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
    border-color: var(--md-sys-color-outline);
    color: var(--md-sys-color-outline);
  }

  input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
`

export const Dropzone = styled.div`
  position: absolute;
  inset: var(--padding-s);
  background-color: var(--md-sys-color-surface-container-lowest);

  border-radius: var(--border-radius-xxl);
  border: 2px dashed var(--md-sys-color-outline);

  display: flex;
  gap: var(--base-gap-large);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;

  & > * {
    user-select: none;
    pointer-events: none;
  }
  .icon {
    font-size: 32px;
  }
`
