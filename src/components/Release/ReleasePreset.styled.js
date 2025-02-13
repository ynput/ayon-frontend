import styled from 'styled-components'

export const Preset = styled.li`
  display: flex;
  padding: 8px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: var(--base-gap-large);
  align-self: stretch;
  user-select: none;
  cursor: pointer;
  margin: 0;
  position: relative;

  border-radius: 4px;
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-primary-container);

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  .description {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  &.selected {
    &,
    &:hover {
      background-color: var(--md-sys-color-primary-container);
    }

    .description {
      white-space: normal;
    }
  }
`

export const Header = styled.header`
  display: flex;
  padding: 0px 8px;
  align-items: flex-start;
  gap: 16px;
  align-self: stretch;

  .icon {
    font-size: 32px;
    margin-top: 8px;
  }

  div {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    flex: 1 0 0;
    overflow: hidden;

    h3 {
      /* font-size: 16px; */
      border: none;
      margin: 0;
      padding: 0;
      /* font-weight: bold; */
    }
  }
`

export const Addons = styled.span`
  &,
  & span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  & span {
    font-size: inherit;
  }
`
