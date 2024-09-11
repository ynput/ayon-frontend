import styled from "styled-components"

const Reaction = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;

  height: 24px;
  padding: 0px 8px;
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
`
const ActiveReactionsList = styled.div`
  outline: 'solid 1px red';
  display: flex;
  gap: 8px;
`

const ReactionsPanel = styled.div`
  display: flex;
  gap: 8px;

  position: absolute;
  top: -40px;
  left: 16px;
  z-index: 30;

  background-color: var(--md-sys-color-surface-container-high);
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0px 0px 4px 4px rgba(0, 0, 0, 0.25);

  animation: 0.03s ease-in forwards;
  transform-origin: bottom left;
  .emoji {
    display: flex;
    justify-content: center;
    align-items: center;

    width: 32px;
    height: 32px;
    font-size: 14px;
    &:hover {
      border-radius: var(--border-radius-m);
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
  }
`


const ReactionPanelOpener = styled.div`
  user-select: none;
  .add-reaction {
    background-color: var(--md-sys-color-surface-container-high);
    border-radius: 12px;
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`
const ReactionsWrapper = styled.div`
  display: flex;
  gap: 8px;
  position: relative;
`

export { Reaction, ActiveReactionsList, ReactionsPanel, ReactionPanelOpener, ReactionsWrapper }