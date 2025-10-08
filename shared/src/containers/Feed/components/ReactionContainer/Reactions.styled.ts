import styled, { css } from 'styled-components'

type CategoryProps = {
  $categoryPrimary?: string
  $categorySecondary?: string
  $categoryTertiary?: string
}

const categoryColorCss = (
  $categoryPrimary?: string,
  $categorySecondary?: string,
  $categoryTertiary?: string,
) =>
  $categoryPrimary &&
  css`
    --reaction-border-color: ${$categoryPrimary};
    --reaction-active-bg: ${$categorySecondary};
    --reaction-hover-bg: ${$categorySecondary};
    --reaction-active-border: ${$categoryPrimary};
  `

const Reaction = styled.div<CategoryProps>`
  /* VARS */
  --reaction-border-color: var(--md-sys-color-outline-variant);
  --reaction-hover-bg: var(--md-sys-color-surface-container-high-hover);
  --reaction-hover-border: var(--md-sys-color-outline);
  --reaction-active-bg: var(--md-sys-color-primary-container);
  --reaction-active-border: var(--md-sys-color-primary);
  --reaction-active-hover-bg: var(--md-sys-color-primary-container-hover);
  --reaction-active-hover-border: var(--md-sys-color-primary-hover);
  --reaction-compact-active-bg: var(--md-sys-color-primary-container);
  --reaction-compact-active-hover-bg: var(--md-sys-color-primary-container-hover);

  /* CATEGORY */
  ${({ $categoryPrimary, $categorySecondary, $categoryTertiary }) =>
    categoryColorCss($categoryPrimary, $categorySecondary, $categoryTertiary)}

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;

  height: 24px;
  padding: 0px 8px;
  cursor: pointer;
  user-select: none;

  border: solid 1px var(--reaction-border-color);
  border-radius: 12px;
  &:hover {
    background-color: var(--reaction-hover-bg);
    border-color: ${({ $categoryPrimary }) =>
      $categoryPrimary ? 'var(--reaction-border-color)' : 'var(--reaction-hover-border)'};
    filter: ${({ $categoryPrimary }) => ($categoryPrimary ? 'brightness(1.2)' : 'none')};
  }
  &.active {
    background-color: var(--reaction-active-bg);
    border-color: var(--reaction-active-border);
    &:hover {
      background-color: var(--reaction-hover-bg);
      border-color: ${({ $categoryPrimary }) =>
        $categoryPrimary ? 'var(--reaction-border-color)' : 'var(--reaction-active-hover-border)'};
    }
  }

  &.compact {
    width: 32px;
    height: 32px;
    padding: 8px;
    border-color: transparent;
    border-radius: var(--border-radius-m);
    &:hover {
      background-color: ${({ $categoryPrimary }) =>
        $categoryPrimary
          ? 'var(--reaction-hover-bg)'
          : 'var(--md-sys-color-surface-container-high-hover)'};
    }
    &.active {
      background-color: ${({ $categoryPrimary }) =>
        $categoryPrimary ? $categoryPrimary : 'var(--reaction-compact-active-bg)'};
      &:hover {
        border-color: transparent;
        background-color: var(--reaction-hover-bg);
        filter: ${({ $categoryPrimary }) => ($categoryPrimary ? 'brightness(1.2)' : 'none')};
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
const ReactionsPanel = styled.div<CategoryProps>`
  /* VARS */
  --panel-bg: var(--md-sys-color-surface-container-high);

  /* CATEGORY */
  ${({ $categoryPrimary, $categorySecondary }) =>
    $categorySecondary &&
    css`
      --panel-bg: ${$categorySecondary};
    `}

  display: flex;
  gap: 4px;

  position: absolute;
  top: -48px;
  left: 0;
  z-index: 60;

  background-color: var(--panel-bg);
  padding: 4px;
  border-radius: 4px;
  box-shadow: 0px 0px 6px 2px rgba(0, 0, 0, 0.15);
`

const ReactionPanelOpener = styled.div<CategoryProps>`
  /* VARS */
  --opener-bg: var(--md-sys-color-surface-container-high);
  --opener-hover-bg: var(--md-sys-color-surface-container-high-hover);
  --opener-color: var(--md-sys-color-outline);

  /* CATEGORY */
  ${({ $categoryPrimary, $categorySecondary }) =>
    $categorySecondary &&
    css`
      --opener-bg: ${$categorySecondary};
      --opener-hover-bg: ${$categorySecondary};
      --opener-color: ${$categoryPrimary};
    `}

  user-select: none;
  .add-reaction {
    background-color: var(--opener-bg);
    color: var(--opener-color);
    border-radius: 12px;
    font-size: 16px;
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    &:hover {
      background-color: var(--opener-hover-bg);
      filter: ${({ $categoryPrimary }) => ($categoryPrimary ? 'brightness(1.2)' : 'none')};
    }
  }
`
const ReactionsWrapper = styled.div<CategoryProps>`
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
