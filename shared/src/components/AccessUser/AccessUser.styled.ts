import styled from 'styled-components'

export const User = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-medium);
  padding: var(--padding-s) var(--padding-m);
  border-radius: var(--border-radius-m);
  min-height: 40px;

  &.compact {
    min-height: 32px;
    padding: var(--padding-s);
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  .title-label {
    flex: 1;
    display: flex;
  }

  .name {
    color: var(--md-sys-color-outline);
    padding-left: var(--base-gap-small);
  }
  .float-right {
    margin-left: auto;
  }

  .owner,
  .suffix {
    color: var(--md-sys-color-outline);
  }

  .icon {
    font-size: 24px;
    user-select: none;
  }

  .remove.hasIcon {
    padding: 2px;
    font-size: 20px;
  }
`
