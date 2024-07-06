import styled from 'styled-components'

export const ReviewablesSelector = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow-y: auto;
  min-width: fit-content;
  height: 100%;

  gap: var(--base-gap-small);
`

export const ReviewableCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 89px;

  border-radius: var(--border-radius-l);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-high);
  border: solid 2px var(--md-sys-color-surface-container-high);
  padding: 2px;

  cursor: pointer;
  user-select: none;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
    border-color: var(--md-sys-color-surface-container-high-hover);

    img {
      filter: brightness(1.1);
    }
  }

  img {
    width: 100%;
    height: 48px;
    object-fit: cover;
    border-radius: var(--border-radius-m);
  }

  span {
    display: block;
    text-align: center;
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    border-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary-container);
  }
`
