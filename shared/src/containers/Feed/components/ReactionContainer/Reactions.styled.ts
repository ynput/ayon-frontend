import styled from 'styled-components'

const Reaction = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;

  height: 24px;
  padding: 0px 8px;
  cursor: pointer;
  user-select: none;

  border: solid 1px var(--md-sys-color-outline-variant);
  border-radius: 12px;
  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
    border-color: var(--md-sys-color-outline);
  }
  &.active {
    background-color: var(--md-sys-color-primary-container);
    border-color: var(--md-sys-color-primary);
    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);
      border-color: var(--md-sys-color-primary-hover);
    }
  }

  &.compact {
    width: 32px;
    height: 32px;
    padding: 8px;
    border-color: transparent;
    border-radius: var(--border-radius-m);
    &.active {
      background-color: var(--md-sys-color-secondary-container);
      &:hover {
        border-color: transparent;
        background-color: var(--md-sys-color-secondary-container-hover);
      }
    }
  }

  .emoji {
    position: relative;
    height: 19px;
  }
`
const ActiveReactionsList = styled.div`
  outline: 'solid 1px red';
  display: flex;
  gap: 8px;
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 55;
`
const ReactionsPanel = styled.div`
  display: flex;
  gap: 4px;

  position: absolute;
  top: -48px;
  left: 0;
  z-index: 60;

  background-color: var(--md-sys-color-surface-container-high);
  padding: 4px;
  border-radius: 4px;
  box-shadow: 0px 0px 6px 2px rgba(0, 0, 0, 0.15);
`

const ReactionPanelOpener = styled.div`
  user-select: none;
  .add-reaction {
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-outline);
    border-radius: 12px;
    font-size: 16px;
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    &:hover {
      background-color: var(--md-sys-color-surface-container-high-hover);
    }
  }
`
const ReactionsWrapper = styled.div`
  display: flex;
  gap: 8px;
  position: relative;
`

export {
  Reaction,
  ActiveReactionsList,
  ReactionsPanel,
  ReactionPanelOpener,
  ReactionsWrapper,
  Overlay,
}
