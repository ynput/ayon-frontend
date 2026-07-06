import styled from 'styled-components'

export const Title = styled.li`
  padding: 6px 8px;
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-outline);
  border-radius: var(--border-radius-m) var(--border-radius-m) 0 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const PrefixFilters = styled.span`
  display: flex;
  gap: 2px;
`

export const PrefixButton = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--border-radius-m);
  cursor: pointer;
  color: var(--md-sys-color-outline);

  .icon {
    font-size: 16px;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
    color: var(--md-sys-color-on-surface);
  }

  &.active {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }
`

export const MentionSelect = styled.ul`
  margin: 0;
  translate: 0 -100%;
  z-index: 1000;

  background-color: var(--md-sys-color-surface-container-high);
  padding: 0;

  position: absolute;

  top: -4px;
  right: 4px;
  left: 4px;
  border-radius: var(--border-radius-m);

  /* box shadow */
  box-shadow: 0 3px 15px 0 rgba(0, 0, 0, 0.4);
`
export const MentionItem = styled.li`
  /* reset defaults*/
  list-style: none;
  margin: 0;
  padding: 6px 8px;
  border-radius: var(--border-radius-m);

  display: flex;
  gap: var(--base-gap-large);
  align-items: center;
  user-select: none;
  cursor: pointer;

  &:hover,
  &.selected {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  .image {
    &.square {
      border-radius: 50%;
    }
  }
`

export const MentionName = styled.span`
  font-weight: 500;
`

export const MentionPrefix = styled.span`
  margin-right: -4px;
`

export const MentionSuffix = styled.span`
  color: var(--md-sys-color-outline);
  margin-left: auto;
`
